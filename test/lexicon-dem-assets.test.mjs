import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import initSqlJs from 'sql.js';

const sourceUrl = new URL(
  '../scripts/lexicon/FILE2017-DEM-FEMELEX-RC4.txt',
  import.meta.url,
);
const manifestUrl = new URL('../public/lexicon/dem/rc4/manifest.json', import.meta.url);
const newWordsUrl = new URL('../public/lexicon/dem/rc4/new-words.json', import.meta.url);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const toBrowserWord = (word) => word
  .replaceAll('[CH]', 'Ç')
  .replaceAll('[LL]', 'K')
  .replaceAll('[RR]', 'W');

test('DLE + DEM assets preserve the audited RC4 source and strict FILE2017 union', async () => {
  const [source, baselineBytes, manifestBytes, newWordsBytes] = await Promise.all([
    readFile(sourceUrl),
    readFile(new URL('../public/spanish_words_local.json', import.meta.url)),
    readFile(manifestUrl),
    readFile(newWordsUrl),
  ]);
  assert.equal(source.length, 7_545_591);
  assert.equal(
    sha256(source),
    'fb726669d6fc91c0aa851de401a1075a85166da730214c9427483ed3af3bda46',
  );

  const releaseWords = source.toString('utf8')
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(toBrowserWord);
  const baselineWords = JSON.parse(baselineBytes.toString('utf8')).words;
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const additions = JSON.parse(newWordsBytes.toString('utf8'));
  const releaseSet = new Set(releaseWords);
  const baselineSet = new Set(baselineWords);

  assert.equal(releaseWords.length, 659_883);
  assert.equal(releaseSet.size, 659_883);
  assert.equal(baselineWords.length, 639_293);
  assert.equal(baselineWords.every((word) => releaseSet.has(word)), true);
  assert.equal(manifest.releaseId, 'lexicon-dle23-dem-femelex-rc4');
  assert.equal(manifest.wordCount, 659_883);
  assert.equal(manifest.deltaFrom2017.additions.count, 20_590);
  assert.equal(manifest.deltaFrom2017.removals.count, 0);
  assert.equal(additions.count, 20_590);
  assert.equal(additions.words.length, 20_590);
  assert.equal(new Set(additions.words).size, 20_590);
  assert.equal(additions.words.every((word) => !baselineSet.has(word)), true);
});

test('DLE + DEM shards reconstruct the exact browser word set', async () => {
  const SQL = await initSqlJs();
  const [source, manifestBytes] = await Promise.all([
    readFile(sourceUrl),
    readFile(manifestUrl),
  ]);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const reconstructed = [];
  let compressedBytes = 0;

  for (const [length, descriptor] of Object.entries(manifest.lengths)) {
    const shardUrl = new URL(`../public/lexicon/dem/rc4/length-${length}.dbpack`, import.meta.url);
    const compressed = await readFile(shardUrl);
    assert.equal(compressed.length, descriptor.compressedBytes);
    assert.equal(sha256(compressed), descriptor.sha256);
    compressedBytes += compressed.length;

    const database = new SQL.Database(gunzipSync(compressed));
    const rows = database.exec('SELECT word FROM words ORDER BY word');
    const words = rows[0]?.values.map(([word]) => word) ?? [];
    assert.equal(words.length, descriptor.wordCount);
    assert.equal(words.every((word) => [...word].length === Number(length)), true);
    reconstructed.push(...words);
    database.close();
  }

  const sourceWords = source.toString('utf8')
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(toBrowserWord)
    .sort();
  reconstructed.sort();
  assert.equal(reconstructed.length, 659_883);
  assert.equal(compressedBytes, manifest.totalCompressedBytes);
  assert.equal(
    sha256(Buffer.from(`${reconstructed.join('\n')}\n`)),
    sha256(Buffer.from(`${sourceWords.join('\n')}\n`)),
  );
});

test('DLE + DEM shards honor accepted and rejected RC4 adjudications', async () => {
  const SQL = await initSqlJs();
  const databases = new Map();
  const contains = async (word) => {
    const length = [...word].length;
    let database = databases.get(length);
    if (!database) {
      const compressed = await readFile(new URL(
        `../public/lexicon/dem/rc4/length-${length}.dbpack`,
        import.meta.url,
      ));
      database = new SQL.Database(gunzipSync(compressed));
      databases.set(length, database);
    }
    const statement = database.prepare('SELECT 1 FROM words WHERE word = ? LIMIT 1');
    statement.bind([word]);
    const found = statement.step();
    statement.free();
    return found;
  };

  for (const word of ['ÇONÇO', 'THINNERS', 'OJETA', 'BOILERES', 'MINIVANES']) {
    assert.equal(await contains(word), true, `${word} should be accepted`);
  }
  assert.equal(await contains('ADUCTRIZ'), false);
  for (const database of databases.values()) database.close();
});
