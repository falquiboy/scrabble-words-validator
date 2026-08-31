import test from 'node:test';
import assert from 'node:assert/strict';

import { sortWordsByAddedLetter } from '../src/utils/additionalLetterSort.ts';

test('orders added tiles with vowels first', () => {
  assert.deepEqual(
    sortWordsByAddedLetter('B', ['BC', 'BU', 'BA', 'BO', 'BE', 'BI']),
    ['BA', 'BE', 'BI', 'BO', 'BU', 'BC'],
  );
});

test('uses traditional Spanish order inside an added-tile group', () => {
  assert.deepEqual(
    sortWordsByAddedLetter('AB', ['ACB', 'ABC']),
    ['ABC', 'ACB'],
  );
});
