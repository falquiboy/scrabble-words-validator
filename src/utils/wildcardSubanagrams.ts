import { processDigraphs } from './digraphs.ts';
import { compareSpanishTiles, compareSpanishWords } from '../lexicon/policy.mjs';

export const MIN_SHORTER_WORD_TILES = 2;

export interface WildcardRackProfile {
  realTiles: string;
  totalTileCount: number;
  usableWildcardCount: number;
}

export interface ShorterWildcardGroups {
  relevantWithWildcard: string[];
  withoutWildcard: string[];
}

const VALUABLE_REAL_TILES = new Set([
  'H', 'F', 'V', 'Y', // 4 points
  'Ç', 'Q', // CH and Q: 5 points
  'J', 'K', 'Ñ', 'W', 'X', // J, LL, Ñ, RR and X: 8 points
  'Z', // 10 points
]);

export const getWildcardRackProfile = (rack: string): WildcardRackProfile => {
  const wildcardCount = (rack.match(/\?/g) || []).length;
  const realTiles = processDigraphs(rack.replace(/\?/g, ''));

  return {
    realTiles,
    totalTileCount: realTiles.length + wildcardCount,
    // Shorter words may consume one blank at most, even when the rack has two.
    usableWildcardCount: Math.min(wildcardCount, 1),
  };
};

export const countRequiredWildcards = (word: string, realRackTiles: string): number => {
  const available = new Map<string, number>();
  for (const tile of processDigraphs(realRackTiles)) {
    available.set(tile, (available.get(tile) || 0) + 1);
  }

  let requiredWildcards = 0;
  for (const tile of processDigraphs(word)) {
    const remaining = available.get(tile) || 0;
    if (remaining > 0) {
      available.set(tile, remaining - 1);
    } else {
      requiredWildcards += 1;
    }
  }

  return requiredWildcards;
};

export const usesRealValuableTile = (word: string, rack: string): boolean => {
  const profile = getWildcardRackProfile(rack);
  const available = new Map<string, number>();
  for (const tile of profile.realTiles) {
    available.set(tile, (available.get(tile) || 0) + 1);
  }

  for (const tile of processDigraphs(word)) {
    const remaining = available.get(tile) || 0;
    if (remaining > 0) {
      available.set(tile, remaining - 1);
      if (VALUABLE_REAL_TILES.has(tile)) return true;
    }
  }

  return false;
};

export const requiresValuableTileForWildcardSubanagrams = (rack: string): boolean =>
  getWildcardRackProfile(rack).totalTileCount <= 7;

export const partitionShorterWordsWithWildcards = (
  words: readonly string[],
  rack: string,
): ShorterWildcardGroups => {
  const profile = getWildcardRackProfile(rack);
  const requiresValuableTile = requiresValuableTileForWildcardSubanagrams(rack);
  const relevantWithWildcard: string[] = [];
  const withoutWildcard: string[] = [];

  for (const word of words) {
    const requiredWildcards = countRequiredWildcards(word, profile.realTiles);
    if (requiredWildcards === 0) {
      withoutWildcard.push(word);
    } else if (
      requiredWildcards === 1 &&
      (!requiresValuableTile || usesRealValuableTile(word, rack))
    ) {
      relevantWithWildcard.push(word);
    }
  }

  return { relevantWithWildcard, withoutWildcard };
};

export const getWildcardWordSortKeys = (word: string, rack: string) => {
  const profile = getWildcardRackProfile(rack);
  const available = new Map<string, number>();
  for (const tile of profile.realTiles) {
    available.set(tile, (available.get(tile) || 0) + 1);
  }

  const normalizedWord = processDigraphs(word);
  for (let index = 0; index < normalizedWord.length; index++) {
    const tile = normalizedWord[index];
    const remaining = available.get(tile) || 0;
    if (remaining > 0) {
      available.set(tile, remaining - 1);
      continue;
    }

    return {
      wildcardTile: tile,
      remainingWord: normalizedWord.slice(0, index) + normalizedWord.slice(index + 1),
    };
  }

  return { wildcardTile: '', remainingWord: normalizedWord };
};

export const sortWordsByFirstWildcardTile = (
  words: readonly string[],
  rack: string,
): string[] => {
  const keys = new Map(words.map((word) => [word, getWildcardWordSortKeys(word, rack)]));

  return [...words].sort((left, right) => {
    const leftKeys = keys.get(left)!;
    const rightKeys = keys.get(right)!;
    const wildcardComparison = compareSpanishTiles(
      leftKeys.wildcardTile,
      rightKeys.wildcardTile,
    );
    if (wildcardComparison !== 0) return wildcardComparison;

    const remainingComparison = compareSpanishWords(
      leftKeys.remainingWord,
      rightKeys.remainingWord,
    );
    return remainingComparison || compareSpanishWords(left, right);
  });
};

// Backward-compatible name used by the focused wildcard tests.
export const sortRelevantWildcardSubanagrams = sortWordsByFirstWildcardTile;

export const isAllowedShorterWordWithWildcards = (
  word: string,
  rack: string,
  minLength = MIN_SHORTER_WORD_TILES,
): boolean => {
  const profile = getWildcardRackProfile(rack);
  const wordLength = processDigraphs(word).length;

  if (wordLength < minLength || wordLength >= profile.totalTileCount) return false;

  return countRequiredWildcards(word, profile.realTiles) <= profile.usableWildcardCount;
};
