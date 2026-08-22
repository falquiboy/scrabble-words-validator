export const LEXICON_MODE_2017 = '2017';
export const LEXICON_MODE_HYBRID = 'hybrid';
export const LEXICON_MODE_2027 = '2027';
export const LEXICON_MODES = Object.freeze([
  LEXICON_MODE_2017,
  LEXICON_MODE_HYBRID,
  LEXICON_MODE_2027,
]);

// Traditional Spanish tile collation used for visible words. The dictionary
// stores CH, LL and RR as Ç, K and W respectively, so those internal symbols
// are deliberately placed after their base letter.
const TRADITIONAL_SPANISH_ALPHABET = Object.freeze([
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'L', 'K', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'W',
  'S', 'T', 'U', 'V', 'X', 'Y', 'Z',
]);
const TRADITIONAL_SPANISH_ORDER = new Map(
  TRADITIONAL_SPANISH_ALPHABET.map((letter, index) => [letter, index]),
);

function normalizeForTraditionalSpanishSort(word) {
  return String(word ?? '')
    .toUpperCase()
    .replace(/Ñ/g, '\uE000')
    .replace(/Ç/g, '\uE001')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/\uE000/g, 'Ñ')
    .replace(/\uE001/g, 'Ç')
    .replace(/CH/g, 'Ç')
    .replace(/LL/g, 'K')
    .replace(/RR/g, 'W');
}

function compareNormalizedSpanishWords(normalizedLeft, normalizedRight, left, right) {
  const limit = Math.min(normalizedLeft.length, normalizedRight.length);

  for (let index = 0; index < limit; index += 1) {
    const leftLetter = normalizedLeft[index];
    const rightLetter = normalizedRight[index];
    const leftOrder = TRADITIONAL_SPANISH_ORDER.get(leftLetter);
    const rightOrder = TRADITIONAL_SPANISH_ORDER.get(rightLetter);
    if (leftOrder !== rightOrder) {
      if (leftOrder === undefined) return 1;
      if (rightOrder === undefined) return -1;
      return leftOrder - rightOrder;
    }
  }

  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length - normalizedRight.length;
  }
  return String(left).localeCompare(String(right), 'es');
}

export function compareSpanishWords(left, right) {
  return compareNormalizedSpanishWords(
    normalizeForTraditionalSpanishSort(left),
    normalizeForTraditionalSpanishSort(right),
    left,
    right,
  );
}

export function sortSpanishWords(words) {
  // Cache the collation key once per word. Large length-only searches would
  // otherwise normalize both operands again for every sort comparison.
  return [...(words || [])]
    .map((word) => ({
      word,
      normalized: normalizeForTraditionalSpanishSort(word),
    }))
    .sort((left, right) => compareNormalizedSpanishWords(
      left.normalized,
      right.normalized,
      left.word,
      right.word,
    ))
    .map(({ word }) => word);
}

export function normalizeLexiconMode(value) {
  return LEXICON_MODES.includes(value) ? value : LEXICON_MODE_2017;
}

export function primaryReleaseForMode(mode) {
  return normalizeLexiconMode(mode) === LEXICON_MODE_2017 ? '2017' : '2027';
}

export function mergeUniqueWords(primary, additions) {
  return sortSpanishWords(Array.from(new Set([...(primary || []), ...(additions || [])])));
}

export function sortNewWordsFirst(words, newWords, enabled) {
  const alphabetized = sortSpanishWords(words);
  if (!enabled) return alphabetized;
  const fresh = [];
  const established = [];
  for (const word of alphabetized) {
    (newWords.has(word) ? fresh : established).push(word);
  }
  return [...fresh, ...established];
}

export function classifyDeltaWord(word, newWords, legacyWords) {
  if (newWords.has(word)) return 'new-2027';
  if (legacyWords.has(word)) return 'only-2017';
  return 'shared';
}
