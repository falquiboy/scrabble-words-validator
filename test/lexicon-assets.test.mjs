import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import initSqlJs from 'sql.js';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('2027 assets preserve the verified source and delta counts', async () => {
  const source = await readFile(new URL('../scripts/lexicon/FILE2027-RC1.txt', import.meta.url));
  assert.equal(source.length, 7_433_680);
  assert.equal(createHash('sha256').update(source).digest('hex'), '7a0f942fe8334a206f5914ea8593e57ab7c983f6d16d36204e1b7c7b0d73f6a8');

  const [manifest, fresh, legacy] = await Promise.all([
    readJson('../public/lexicon/2027/manifest.json'),
    readJson('../public/lexicon/2027/new-words.json'),
    readJson('../public/lexicon/2027/legacy-words.json'),
  ]);
  assert.equal(manifest.wordCount, 650_054);
  assert.equal(fresh.count, 10_975);
  assert.equal(new Set(fresh.words).size, fresh.count);
  assert.equal(legacy.count, 214);
  assert.equal(new Set(legacy.words).size, legacy.count);
  assert.equal(fresh.words.some((word) => legacy.words.includes(word)), false);
  assert.equal(fresh.words.includes('BAISA'), true);
});

test('2027 shards accept an addition and exclude a 2017-only spelling', async () => {
  const SQL = await initSqlJs();
  const contains = async (word) => {
    const shard = gunzipSync(await readFile(
      new URL(`../public/lexicon/2027/length-${[...word].length}.dbpack`, import.meta.url)
    ));
    const database = new SQL.Database(shard);
    const statement = database.prepare('SELECT 1 FROM words WHERE word = ? LIMIT 1');
    statement.bind([word]);
    const found = statement.step();
    statement.free();
    database.close();
    return found;
  };
  assert.equal(await contains('ABASIDA'), true);
  assert.equal(await contains('AFEITADERA'), false);
});
