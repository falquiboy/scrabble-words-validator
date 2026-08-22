import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { processDigraphs, toDisplayFormat } from '../src/utils/digraphs.ts';

test('digraph normalization preserves words that are already in internal format', () => {
  assert.equal(processDigraphs('BACHA'), 'BAÇA');
  assert.equal(processDigraphs('BAÇA'), 'BAÇA');
  assert.equal(processDigraphs('CHIPO'), 'ÇIPO');
  assert.equal(processDigraphs('ÇIPO'), 'ÇIPO');
  assert.equal(processDigraphs('CHONI'), 'ÇONI');
  assert.equal(processDigraphs('ÇONI'), 'ÇONI');
  assert.equal(processDigraphs('cañón'), 'CAÑON');
  assert.equal(toDisplayFormat('BAÇA'), 'BACHA');
});

test('new CH words retain the normalized keys used by the 2027 badge', async () => {
  const payload = JSON.parse(
    await readFile(new URL('../public/lexicon/2027/new-words.json', import.meta.url), 'utf8'),
  );
  const newWords = new Set(payload.words);

  for (const word of ['BAÇA', 'ÇIPO', 'ÇONI']) {
    assert.equal(processDigraphs(word), word);
    assert.ok(newWords.has(processDigraphs(word)), `${toDisplayFormat(word)} should carry the 2027 badge`);
  }
});
