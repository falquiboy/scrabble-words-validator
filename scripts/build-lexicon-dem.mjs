import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const require = createRequire(import.meta.url);
const sourcePath = new URL('./lexicon/FILE2017-DEM-FEMELEX-RC4.txt', import.meta.url);
const baselinePath = new URL('../public/spanish_words_local.json', import.meta.url);
const outputDirectory = new URL('../public/lexicon/dem/rc4/', import.meta.url);
const manifestPath = new URL('manifest.json', outputDirectory);
const newWordsPath = new URL('new-words.json', outputDirectory);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

const RELEASE_ID = 'lexicon-dle23-dem-femelex-rc4';
const EXPECTED_SOURCE_BYTES = 7_545_591;
const EXPECTED_SOURCE_SHA256 = 'fb726669d6fc91c0aa851de401a1075a85166da730214c9427483ed3af3bda46';
const EXPECTED_BASELINE_WORDS = 639_293;
const EXPECTED_RELEASE_WORDS = 659_883;
const EXPECTED_NEW_WORDS = 20_590;
const EXPECTED_REMOVED_WORDS = 0;
const MINIMUM_LENGTH = 2;
const MAXIMUM_LENGTH = 15;
const alphabet = 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ';
const order = new Map([...alphabet].map((letter, index) => [letter, index]));

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const toBrowserWord = (word) => word
  .replaceAll('[CH]', 'Ç')
  .replaceAll('[LL]', 'K')
  .replaceAll('[RR]', 'W');
const createAlphagram = (word) => [...word]
  .sort((left, right) => (order.get(left) ?? 999) - (order.get(right) ?? 999))
  .join('');

const sourceBytes = readFileSync(sourcePath);
if (sourceBytes.length !== EXPECTED_SOURCE_BYTES) {
  throw new Error(
    `FILE2017-DEM-FEMELEX-RC4.txt has ${sourceBytes.length} bytes; expected ${EXPECTED_SOURCE_BYTES}`
  );
}
const sourceSha256 = sha256(sourceBytes);
if (sourceSha256 !== EXPECTED_SOURCE_SHA256) {
  throw new Error(`FILE2017-DEM-FEMELEX-RC4.txt SHA-256 mismatch: ${sourceSha256}`);
}

const sourceWords = sourceBytes.toString('utf8')
  .split(/\r?\n/u)
  .map((word) => word.trim())
  .filter(Boolean)
  .map(toBrowserWord);
const releaseWords = [...new Set(sourceWords)].sort();
if (sourceWords.length !== EXPECTED_RELEASE_WORDS || releaseWords.length !== EXPECTED_RELEASE_WORDS) {
  throw new Error(
    `Unexpected DLE + DEM cardinality: ${sourceWords.length} rows, ${releaseWords.length} unique`
  );
}
for (const word of releaseWords) {
  const length = [...word].length;
  if (!/^[A-ZÑÇ]+$/u.test(word) || length < MINIMUM_LENGTH || length > MAXIMUM_LENGTH) {
    throw new Error(`Invalid browser word in DLE + DEM source: ${word}`);
  }
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const baselineWords = baseline.words;
if (!Array.isArray(baselineWords) || baselineWords.length !== EXPECTED_BASELINE_WORDS) {
  throw new Error(`Unexpected FILE2017 cardinality: ${baselineWords?.length ?? 0}`);
}

const baselineSet = new Set(baselineWords);
const releaseSet = new Set(releaseWords);
const newWords = releaseWords.filter((word) => !baselineSet.has(word));
const removedWords = baselineWords.filter((word) => !releaseSet.has(word));
if (newWords.length !== EXPECTED_NEW_WORDS || removedWords.length !== EXPECTED_REMOVED_WORDS) {
  throw new Error(
    `Unexpected DLE + DEM delta: +${newWords.length} / -${removedWords.length}`
  );
}

const wordsByLength = new Map();
for (const word of releaseWords) {
  const length = [...word].length;
  const group = wordsByLength.get(length) ?? [];
  group.push(word);
  wordsByLength.set(length, group);
}

mkdirSync(outputDirectory, { recursive: true });
const SQL = await initSqlJs({ locateFile: () => wasmPath });
const lengths = {};
let totalCompressedBytes = 0;
let totalSqliteBytes = 0;

for (const [length, group] of [...wordsByLength.entries()].sort((a, b) => a[0] - b[0])) {
  const db = new SQL.Database();
  db.exec(`
    PRAGMA page_size = 4096;
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    CREATE TABLE words (
      word TEXT NOT NULL,
      alphagram TEXT NOT NULL,
      length INTEGER NOT NULL
    );
    CREATE INDEX idx_alphagram ON words(alphagram);
  `);

  const insert = db.prepare('INSERT INTO words (word, alphagram, length) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  for (const word of group) insert.run([word, createAlphagram(word), length]);
  insert.free();
  db.exec('COMMIT; ANALYZE;');

  const sqliteBytes = db.export();
  db.close();
  const compressed = gzipSync(sqliteBytes, { level: 9 });
  const filename = `length-${length}.dbpack`;
  writeFileSync(new URL(filename, outputDirectory), compressed);

  lengths[length] = {
    url: `/lexicon/dem/rc4/${filename}`,
    wordCount: group.length,
    compressedBytes: compressed.length,
    sqliteBytes: sqliteBytes.length,
    sha256: sha256(compressed),
  };
  totalCompressedBytes += compressed.length;
  totalSqliteBytes += sqliteBytes.length;
  console.log(`${length} tiles: ${group.length.toLocaleString('en-US')} words`);
}

const newWordPayload = {
  version: 1,
  releaseId: RELEASE_ID,
  kind: 'new-in-dem-rc4',
  count: newWords.length,
  words: newWords,
};
writeFileSync(newWordsPath, `${JSON.stringify(newWordPayload)}\n`);
const newWordIndex = {
  url: '/lexicon/dem/rc4/new-words.json',
  count: newWords.length,
  sha256: sha256(readFileSync(newWordsPath)),
};

const manifest = {
  version: 2,
  format: 'sqlite-length-shards',
  releaseId: RELEASE_ID,
  publicLabel: 'DLE + DEM',
  wordCount: releaseWords.length,
  totalCompressedBytes,
  totalSqliteBytes,
  source: {
    filename: 'FILE2017-DEM-FEMELEX-RC4.txt',
    bytes: sourceBytes.length,
    sha256: sourceSha256,
  },
  companionKwg: {
    filename: 'FILE2017-DEM-FEMELEX-RC4.kwg',
    bytes: 4_506_184,
    sha256: '200fd8a693b177abbdec2893ea91857fd7b366d2b77ede94f96c17aad1090efb',
  },
  baseline: {
    releaseId: 'lexicon-dle23-fise2016',
    wordCount: baselineWords.length,
  },
  deltaFrom2017: {
    additions: newWordIndex,
    removals: { count: removedWords.length },
  },
  lengths,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `DLE + DEM RC4: ${releaseWords.length.toLocaleString('en-US')} words, ` +
  `+${newWords.length.toLocaleString('en-US')} / -${removedWords.length.toLocaleString('en-US')}`
);
