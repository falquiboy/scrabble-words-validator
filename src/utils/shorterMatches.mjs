/**
 * Enumerate the distinct letter multisets (proper subsets) of a rack.
 *
 * Used to compute "shorter" anagram matches directly from the Trie: each
 * subset becomes one alphagram lookup, so a 7-tile rack costs at most 126
 * in-memory lookups instead of scanning every word of every shorter length.
 *
 * @param {string} letters   Already digraph-processed rack, no wildcards.
 * @param {number} minLength Shortest subset to keep (default 2).
 * @param {number} [maxLength] Longest subset to keep (default letters.length - 1).
 * @returns {string[]} Unique subsets, letters sorted by code point, ordered by length then text.
 */
export function enumerateLetterSubsets(letters, minLength = 2, maxLength = letters.length - 1) {
  const tiles = [...letters];
  const lo = Math.max(1, minLength);
  const hi = Math.min(maxLength, tiles.length - 1);
  if (hi < lo) return [];

  const seen = new Set();
  const total = 1 << tiles.length;
  for (let mask = 1; mask < total; mask++) {
    const size = popcount(mask);
    if (size < lo || size > hi) continue;
    const subset = [];
    for (let index = 0; index < tiles.length; index++) {
      if (mask & (1 << index)) subset.push(tiles[index]);
    }
    seen.add(subset.sort().join(''));
  }

  return [...seen].sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0));
}

function popcount(value) {
  let count = 0;
  while (value) {
    value &= value - 1;
    count++;
  }
  return count;
}
