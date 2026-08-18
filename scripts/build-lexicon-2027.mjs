import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const require = createRequire(import.meta.url);
const sourcePath = new URL('./lexicon/FILE2027-RC1.txt', import.meta.url);
const baselinePath = new URL('../public/spanish_words_local.json', import.meta.url);
const outputDirectory = new URL('../public/lexicon/2027/', import.meta.url);
const manifestPath = new URL('manifest.json', outputDirectory);
const newWordsPath = new URL('new-words.json', outputDirectory);
const legacyWordsPath = new URL('legacy-words.json', outputDirectory);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

const RELEASE_ID = 'lexicon-2027-rc1';
const EXPECTED_SOURCE_BYTES = 7_433_680;
const EXPECTED_SOURCE_SHA256 = '7a0f942fe8334a206f5914ea8593e57ab7c983f6d16d36204e1b7c7b0d73f6a8';
const EXPECTED_BASELINE_WORDS = 639_293;
const EXPECTED_RELEASE_WORDS = 650_054;
const EXPECTED_NEW_WORDS = 10_975;
const EXPECTED_LEGACY_WORDS = 214;
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
  throw new Error(`FILE2027-RC1.txt has ${sourceBytes.length} bytes; expected ${EXPECTED_SOURCE_BYTES}`);
}
const sourceSha256 = sha256(sourceBytes);
if (sourceSha256 !== EXPECTED_SOURCE_SHA256) {
  throw new Error(`FILE2027-RC1.txt SHA-256 mismatch: ${sourceSha256}`);
}

const sourceWords = sourceBytes.toString('utf8')
  .split(/\r?\n/u)
  .map((word) => word.trim())
  .filter(Boolean)
  .map(toBrowserWord);
const releaseWords = [...new Set(sourceWords)].sort();
if (sourceWords.length !== EXPECTED_RELEASE_WORDS || releaseWords.length !== EXPECTED_RELEASE_WORDS) {
  throw new Error(
    `Unexpected 2027 cardinality: ${sourceWords.length} rows, ${releaseWords.length} unique`
  );
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const baselineWords = baseline.words;
if (!Array.isArray(baselineWords) || baselineWords.length !== EXPECTED_BASELINE_WORDS) {
  throw new Error(`Unexpected 2017 cardinality: ${baselineWords?.length ?? 0}`);
}

const baselineSet = new Set(baselineWords);
const releaseSet = new Set(releaseWords);
const newWords = releaseWords.filter((word) => !baselineSet.has(word));
const legacyWords = baselineWords.filter((word) => !releaseSet.has(word)).sort();
if (newWords.length !== EXPECTED_NEW_WORDS || legacyWords.length !== EXPECTED_LEGACY_WORDS) {
  throw new Error(`Unexpected release delta: +${newWords.length} / -${legacyWords.length}`);
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
    url: `/lexicon/2027/${filename}`,
    wordCount: group.length,
    compressedBytes: compressed.length,
    sqliteBytes: sqliteBytes.length,
    sha256: sha256(compressed),
  };
  totalCompressedBytes += compressed.length;
  totalSqliteBytes += sqliteBytes.length;
  console.log(`${length} tiles: ${group.length.toLocaleString('en-US')} words`);
}

const writeWordSet = (path, kind, words) => {
  const payload = {
    version: 1,
    releaseId: RELEASE_ID,
    kind,
    count: words.length,
    words,
  };
  writeFileSync(path, `${JSON.stringify(payload)}\n`);
  return {
    url: new URL(path).pathname.endsWith('new-words.json')
      ? '/lexicon/2027/new-words.json'
      : '/lexicon/2027/legacy-words.json',
    count: words.length,
    sha256: sha256(readFileSync(path)),
  };
};

const newWordIndex = writeWordSet(newWordsPath, 'new-in-2027', newWords);
const legacyWordIndex = writeWordSet(legacyWordsPath, 'only-in-2017', legacyWords);
const manifest = {
  version: 2,
  format: 'sqlite-length-shards',
  releaseId: RELEASE_ID,
  publicLabel: '2027',
  wordCount: releaseWords.length,
  totalCompressedBytes,
  totalSqliteBytes,
  source: {
    filename: 'FILE2027-RC1.txt',
    bytes: sourceBytes.length,
    sha256: sourceSha256,
  },
  deltaFrom2017: {
    additions: newWordIndex,
    removals: legacyWordIndex,
  },
  lengths,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `Lexicon 2027: ${releaseWords.length.toLocaleString('en-US')} words, ` +
  `+${newWords.length.toLocaleString('en-US')} / -${legacyWords.length.toLocaleString('en-US')}`
);
