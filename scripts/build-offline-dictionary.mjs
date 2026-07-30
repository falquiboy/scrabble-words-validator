import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const require = createRequire(import.meta.url);
const sourcePath = new URL('../public/spanish_words_local.json', import.meta.url);
const outputDirectory = new URL('../public/lexicon/', import.meta.url);
const manifestPath = new URL('manifest.json', outputDirectory);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
const alphabet = 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ';
const order = new Map([...alphabet].map((letter, index) => [letter, index]));

const createAlphagram = (word) =>
  [...word]
    .sort((left, right) => (order.get(left) ?? 999) - (order.get(right) ?? 999))
    .join('');

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const words = source.words;

if (!Array.isArray(words) || words.length < 600_000) {
  throw new Error(`Diccionario incompleto: ${words?.length ?? 0} palabras`);
}

const wordsByLength = new Map();
for (const word of words) {
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

  const insert = db.prepare(
    'INSERT INTO words (word, alphagram, length) VALUES (?, ?, ?)'
  );
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
    url: `/lexicon/${filename}`,
    wordCount: group.length,
    compressedBytes: compressed.length,
    sqliteBytes: sqliteBytes.length,
  };
  totalCompressedBytes += compressed.length;
  totalSqliteBytes += sqliteBytes.length;
  console.log(
    `${length} letras: ${group.length.toLocaleString('es-MX')} palabras, ` +
    `${(compressed.length / 1024 / 1024).toFixed(2)} MB`
  );
}

const manifest = {
  version: 1,
  format: 'sqlite-length-shards',
  wordCount: words.length,
  totalCompressedBytes,
  totalSqliteBytes,
  lengths,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `SQLite fragmentada: ${(totalSqliteBytes / 1024 / 1024).toFixed(1)} MB → ` +
  `${(totalCompressedBytes / 1024 / 1024).toFixed(1)} MB (${words.length.toLocaleString('es-MX')} palabras)`
);
