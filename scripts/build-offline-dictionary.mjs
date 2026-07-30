import { gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const require = createRequire(import.meta.url);
const sourcePath = new URL('../public/spanish_words_local.json', import.meta.url);
// Extensión neutra: algunos servidores marcan automáticamente *.gz como
// Content-Encoding:gzip y el navegador lo descomprime sin avisar.
const outputPath = new URL('../public/lexicon.dbpack', import.meta.url);
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

const SQL = await initSqlJs({ locateFile: () => wasmPath });
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
  CREATE INDEX idx_length ON words(length);
  CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) WITHOUT ROWID;
`);

const insertWord = db.prepare(
  'INSERT INTO words (word, alphagram, length) VALUES (?, ?, ?)'
);

db.exec('BEGIN');
for (let index = 0; index < words.length; index += 1) {
  const word = words[index];
  insertWord.run([word, createAlphagram(word), [...word].length]);
  if (index > 0 && index % 100_000 === 0) {
    console.log(`Indexadas ${index.toLocaleString('es-MX')} palabras…`);
  }
}
insertWord.free();

const insertMetadata = db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)');
insertMetadata.run(['dictionary_version', source.metadata?.format_version ?? '1']);
insertMetadata.run(['word_count', String(words.length)]);
insertMetadata.run(['generated_at', new Date().toISOString()]);
insertMetadata.free();
db.exec('COMMIT; ANALYZE;');

const sqliteBytes = db.export();
db.close();

const compressed = gzipSync(sqliteBytes, { level: 9 });
writeFileSync(outputPath, compressed);

console.log(
  `SQLite offline: ${(sqliteBytes.length / 1024 / 1024).toFixed(1)} MB → ` +
  `${(compressed.length / 1024 / 1024).toFixed(1)} MB (${words.length.toLocaleString('es-MX')} palabras)`
);
