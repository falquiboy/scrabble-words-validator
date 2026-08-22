import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyDeltaWord,
  compareSpanishWords,
  mergeUniqueWords,
  normalizeLexiconMode,
  primaryReleaseForMode,
  sortNewWordsFirst,
  sortSpanishWords,
} from '../src/lexicon/policy.mjs';

test('unknown stored modes safely fall back to 2017', () => {
  assert.equal(normalizeLexiconMode('future'), '2017');
  assert.equal(normalizeLexiconMode('hybrid'), 'hybrid');
  assert.equal(primaryReleaseForMode('2017'), '2017');
  assert.equal(primaryReleaseForMode('hybrid'), '2027');
  assert.equal(primaryReleaseForMode('2027'), '2027');
});

test('hybrid merge is unique and deterministic', () => {
  assert.deepEqual(mergeUniqueWords(['CASA', 'ZETA'], ['CASA', 'ABACO']), ['ABACO', 'CASA', 'ZETA']);
});

test('new-first sorting keeps traditional alphabetical order inside both groups', () => {
  const words = ['CASA', 'ÑUSTA', 'PERRO', 'ABASIDA'];
  const fresh = new Set(['ÑUSTA', 'ABASIDA']);
  assert.deepEqual(sortNewWordsFirst(words, fresh, true), ['ABASIDA', 'ÑUSTA', 'CASA', 'PERRO']);
  assert.deepEqual(sortNewWordsFirst(words, fresh, false), ['ABASIDA', 'CASA', 'ÑUSTA', 'PERRO']);
});

test('traditional Spanish word order places digraphs and eñe after their base letters', () => {
  const unordered = [
    'SACA', 'WANA', 'RANA', 'ÑAME', 'NUBE',
    'KAMA', 'LANA', 'DADO', 'BAÇA', 'BACA',
  ];
  assert.deepEqual(sortSpanishWords(unordered), [
    'BACA', 'BAÇA', 'DADO', 'LANA', 'KAMA',
    'NUBE', 'ÑAME', 'RANA', 'WANA', 'SACA',
  ]);
  assert.ok(compareSpanishWords('BACHA', 'BADA') < 0);
  assert.ok(compareSpanishWords('BACA', 'BACHA') < 0);
});

test('delta membership distinguishes both releases', () => {
  assert.equal(classifyDeltaWord('ABASIDA', new Set(['ABASIDA']), new Set()), 'new-2027');
  assert.equal(classifyDeltaWord('VIEJA', new Set(), new Set(['VIEJA'])), 'only-2017');
  assert.equal(classifyDeltaWord('CASA', new Set(), new Set()), 'shared');
});
