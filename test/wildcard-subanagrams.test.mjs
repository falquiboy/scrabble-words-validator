import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countRequiredWildcards,
  getWildcardRackProfile,
  isAllowedShorterWordWithWildcards,
  partitionShorterWordsWithWildcards,
  sortRelevantWildcardSubanagrams,
  sortWordsByFirstWildcardTile,
  usesRealValuableTile,
} from '../src/utils/wildcardSubanagrams.ts';

test('shorter words may use zero or one blank, but never two', () => {
  assert.equal(isAllowedShorterWordWithWildcards('ZA', 'ZB??'), true);
  assert.equal(isAllowedShorterWordWithWildcards('ZB', 'ZB??'), true);
  assert.equal(isAllowedShorterWordWithWildcards('AE', 'ZB??'), false);
});

test('two- and three-tile results remain eligible', () => {
  assert.equal(isAllowedShorterWordWithWildcards('ZA', 'ZBC?'), true);
  assert.equal(isAllowedShorterWordWithWildcards('ZAC', 'ZBC?'), true);
  assert.equal(isAllowedShorterWordWithWildcards('Z', 'ZBC?'), false);
});

test('a result must still be shorter than the full rack', () => {
  assert.equal(isAllowedShorterWordWithWildcards('ZAB', 'ZB?'), false);
  assert.equal(isAllowedShorterWordWithWildcards('ZA', 'ZB?'), true);
});

test('digraphs count as one tile while measuring racks and deficits', () => {
  assert.deepEqual(getWildcardRackProfile('CHTOB?'), {
    realTiles: 'ÇTOB',
    totalTileCount: 5,
    usableWildcardCount: 1,
  });
  assert.equal(countRequiredWildcards('CHATO', 'CHTOB'), 1);
  assert.equal(isAllowedShorterWordWithWildcards('CHATO', 'CHTO?'), false);
  assert.equal(isAllowedShorterWordWithWildcards('CHATO', 'CHTOB?'), true);
});

test('wildcard results require a real rack tile worth at least four points', () => {
  assert.equal(usesRealValuableTile('ZA', 'ZB?'), true);
  assert.equal(usesRealValuableTile('ZA', 'AB?'), false);
  assert.equal(usesRealValuableTile('CHE', 'CHA?'), true);
});

test('groups relevant one-blank plays before every no-blank subanagram', () => {
  assert.deepEqual(
    partitionShorterWordsWithWildcards(['ZA', 'ZB', 'BA', 'AZ'], 'ZB?'),
    {
      relevantWithWildcard: ['ZA', 'AZ'],
      withoutWildcard: ['ZB'],
    },
  );
  assert.deepEqual(
    partitionShorterWordsWithWildcards(['AZ', 'AB'], 'AB?'),
    {
      relevantWithWildcard: [],
      withoutWildcard: ['AB'],
    },
  );
});

test('orders relevant plays by wildcard tile and then by the remaining word', () => {
  assert.deepEqual(
    sortRelevantWildcardSubanagrams(['ZEDA', 'ZACA', 'AZCA'], 'ZABC?'),
    ['AZCA', 'ZACA', 'ZEDA'],
  );
});

test('uses the first represented tile for two blanks and additional-letter results', () => {
  assert.deepEqual(
    sortWordsByFirstWildcardTile(['CAB', 'BAC'], 'A??'),
    ['BAC', 'CAB'],
  );
  assert.deepEqual(
    sortWordsByFirstWildcardTile(['DA', 'CHA'], 'A?'),
    ['CHA', 'DA'],
  );
});
