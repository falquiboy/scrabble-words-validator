import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterByQueryConstraints,
  isPatternQuery,
  normalizeUserQueryInput,
  parseUserQuery,
  satisfiesQueryConstraints,
} from '../src/utils/queryLanguage.mjs';

test('keeps plain racks and wildcard racks as anagram searches', () => {
  assert.equal(isPatternQuery('CASERON'), false);
  assert.equal(isPatternQuery('EOCRNS?'), false);
  assert.equal(parseUserQuery('caserón:7').normalized, 'CASERON:7');
  assert.deepEqual(parseUserQuery('CASERON:7').length, 7);
});

test('normalizes the documented pattern, rack and length order', () => {
  const query = parseUserQuery('.R.Z*,AEEBRS:5');
  assert.equal(query.kind, 'pattern');
  assert.equal(query.pattern, '.R.Z*');
  assert.equal(query.rack, 'AEEBRS');
  assert.equal(query.length, 5);
});

test('treats a bare length as a request for every word of that length', () => {
  const query = parseUserQuery(':4');
  assert.equal(query.kind, 'pattern');
  assert.equal(query.pattern, '*');
  assert.equal(query.length, 4);
});

test('keeps compatibility with the former length-before-rack order', () => {
  assert.equal(normalizeUserQueryInput('.R.Z*:5,AEEBRS'), '.R.Z*,AEEBRS:5');
});

test('keeps question marks in racks and removes regex-like pattern uses', () => {
  assert.equal(normalizeUserQueryInput('EOCRNS?'), 'EOCRNS?');
  assert.equal(normalizeUserQueryInput('.R?.,A?'), '.R.,A?');
  assert.equal(normalizeUserQueryInput('CASERON7'), 'CASERON');
});

test('uses stars for placement and reserves minus for exclusions', () => {
  assert.equal(parseUserQuery('*AR').pattern, '*AR');
  assert.equal(parseUserQuery('AR*').pattern, 'AR*');
  assert.equal(parseUserQuery('*CI*').pattern, '*CI*');
  const excluded = parseUserQuery('-ABC:4');
  assert.equal(excluded.pattern, '*');
  assert.equal(satisfiesQueryConstraints('DEDO', excluded.constraints), true);
  assert.equal(satisfiesQueryConstraints('BESO', excluded.constraints), false);
});

test('supports simple required letters and vowel or consonant counts', () => {
  const letters = parseUserQuery('+ABC:4');
  assert.deepEqual(filterByQueryConstraints(['BACA', 'CUBA', 'DEDO'], letters.constraints), ['BACA', 'CUBA']);

  const vowels = parseUserQuery('+4@:5');
  assert.equal(satisfiesQueryConstraints('OIAIS', vowels.constraints), true);
  assert.equal(satisfiesQueryConstraints('CASAS', vowels.constraints), false);

  const consonants = parseUserQuery('+5&:6');
  assert.equal(satisfiesQueryConstraints('SPRINT', consonants.constraints), true);
  assert.equal(satisfiesQueryConstraints('AMIGOS', consonants.constraints), false);
});

test('treats Spanish digraphs as single tiles in counted constraints', () => {
  const query = parseUserQuery('+2LL');
  assert.equal(satisfiesQueryConstraints('LLALLA', query.constraints), true);
  assert.equal(satisfiesQueryConstraints('LLAMA', query.constraints), false);
});
