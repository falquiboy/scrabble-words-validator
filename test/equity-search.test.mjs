import test from 'node:test';
import assert from 'node:assert/strict';
import { canOrderShorterWordsByEquity } from '../src/utils/equitySearch.ts';

test('equity ordering is available only for anagram racks of up to seven tiles', () => {
  assert.equal(canOrderShorterWordsByEquity('CASERON'), true);
  assert.equal(canOrderShorterWordsByEquity('C?SERON'), true);
  assert.equal(canOrderShorterWordsByEquity('ASSNTUGGN?'), false);
  assert.equal(canOrderShorterWordsByEquity('CO*'), false);
});

test('Spanish digraphs count as one tile for equity availability', () => {
  assert.equal(canOrderShorterWordsByEquity('CHILLARR'), true);
  assert.equal(canOrderShorterWordsByEquity('CHILLARRABC'), false);
});
