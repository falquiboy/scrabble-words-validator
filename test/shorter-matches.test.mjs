import test from 'node:test';
import assert from 'node:assert/strict';

import { enumerateLetterSubsets } from '../src/utils/shorterMatches.mjs';

test('enumerates every proper subset of a rack without repeats', () => {
  const subsets = enumerateLetterSubsets('ABC');
  assert.deepEqual(subsets, ['AB', 'AC', 'BC']);
});

test('deduplicates subsets produced by repeated tiles', () => {
  const subsets = enumerateLetterSubsets('AAB', 1);
  assert.deepEqual(subsets, ['A', 'B', 'AA', 'AB']);
});

test('never returns the full rack and honours the minimum length', () => {
  const rack = 'CASERO';
  const subsets = enumerateLetterSubsets(rack, 2);
  assert.ok(subsets.every((s) => s.length >= 2 && s.length < rack.length));
  assert.ok(!subsets.includes([...rack].sort().join('')));
  // 6 tiles, all distinct: C(6,2)+C(6,3)+C(6,4)+C(6,5) = 15+20+15+6
  assert.equal(subsets.length, 56);
});

test('returns nothing for racks too short to have shorter plays', () => {
  assert.deepEqual(enumerateLetterSubsets('A'), []);
  assert.deepEqual(enumerateLetterSubsets('AB', 2), []);
});

test('bounds the work for a full 7-tile rack', () => {
  const subsets = enumerateLetterSubsets('ESTRADO', 2);
  assert.equal(subsets.length, 126 - 7); // all non-empty proper subsets minus the 7 singletons
});
