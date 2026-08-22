import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAnagramWordDisplayKey,
  getAnagramWordInfo,
  getAnagramWordKey,
  setAnagramWordInfoAliases,
} from '../src/utils/anagramWordKeys.ts';

test('canonicalizes display and internal spellings of Spanish digraphs', () => {
  const pairs = [
    ['COCHEARE', 'COÇEARE'],
    ['CALLE', 'CAKE'],
    ['CORRE', 'COWE'],
  ];

  for (const [display, internal] of pairs) {
    assert.equal(getAnagramWordKey(display), internal);
    assert.equal(getAnagramWordKey(internal), internal);
    assert.equal(getAnagramWordDisplayKey(display), display);
    assert.equal(getAnagramWordDisplayKey(internal), display);
  }
});

test('resolves extended information through either digraph representation', () => {
  const wordsData = new Map();
  const cocheare = { lemma: 'cochear', shortDefinition: 'Gobernar el coche.' };
  const calle = { lemma: 'callar', shortDefinition: 'Omitir algo.' };
  const corre = { lemma: 'correr', shortDefinition: 'Ir deprisa.' };

  setAnagramWordInfoAliases(wordsData, 'COÇEARE', cocheare);
  setAnagramWordInfoAliases(wordsData, 'CAKE', calle);
  setAnagramWordInfoAliases(wordsData, 'COWE', corre);

  assert.equal(getAnagramWordInfo(wordsData, 'COCHEARE'), cocheare);
  assert.equal(getAnagramWordInfo(wordsData, 'COÇEARE'), cocheare);
  assert.equal(getAnagramWordInfo(wordsData, 'CALLE'), calle);
  assert.equal(getAnagramWordInfo(wordsData, 'CAKE'), calle);
  assert.equal(getAnagramWordInfo(wordsData, 'CORRE'), corre);
  assert.equal(getAnagramWordInfo(wordsData, 'COWE'), corre);
});
