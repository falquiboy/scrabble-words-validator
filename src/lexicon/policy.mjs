export const LEXICON_MODE_2017 = '2017';
export const LEXICON_MODE_HYBRID = 'hybrid';
export const LEXICON_MODE_2027 = '2027';
export const LEXICON_MODES = Object.freeze([
  LEXICON_MODE_2017,
  LEXICON_MODE_HYBRID,
  LEXICON_MODE_2027,
]);

export function normalizeLexiconMode(value) {
  return LEXICON_MODES.includes(value) ? value : LEXICON_MODE_2017;
}

export function primaryReleaseForMode(mode) {
  return normalizeLexiconMode(mode) === LEXICON_MODE_2017 ? '2017' : '2027';
}

export function mergeUniqueWords(primary, additions) {
  return Array.from(new Set([...(primary || []), ...(additions || [])])).sort();
}

export function sortNewWordsFirst(words, newWords, enabled) {
  if (!enabled) return words;
  const fresh = [];
  const established = [];
  for (const word of words) {
    (newWords.has(word) ? fresh : established).push(word);
  }
  return [...fresh, ...established];
}

export function classifyDeltaWord(word, newWords, legacyWords) {
  if (newWords.has(word)) return 'new-2027';
  if (legacyWords.has(word)) return 'only-2017';
  return 'shared';
}
