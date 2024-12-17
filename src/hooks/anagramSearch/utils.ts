import { SPANISH_LETTERS } from './constants';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';
import { wordTrie } from '@/utils/trie';

export const generateWildcardCombinations = (base: string, remainingWildcards: number): string[] => {
  if (remainingWildcards === 0) return [base];
  
  const combinations: string[] = [];
  for (const letter of SPANISH_LETTERS) {
    const newBase = base + letter;
    combinations.push(...generateWildcardCombinations(newBase, remainingWildcards - 1));
  }
  return combinations;
};

export const findExactMatches = (processedInput: string): Set<string> => {
  const alphagram = generateAlphagram(processedInput);
  return new Set(wordTrie.findAnagrams(alphagram));
};

export const findWildcardMatches = (processedInput: string, wildcardCount: number): Set<string> => {
  const matches = new Set<string>();
  const combinations = generateWildcardCombinations(processedInput, wildcardCount);
  const expectedLength = processedInput.length + wildcardCount;
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = wordTrie.findAnagrams(alphagram);
    comboMatches
      .filter(word => word.length === expectedLength)
      .forEach(match => matches.add(match));
  }
  
  return matches;
};

export const findAdditionalMatches = (baseLetters: string, wildcardCount: number): Set<string> => {
  const matches = new Set<string>();
  const expectedLength = baseLetters.length + wildcardCount + 1; // +1 for the additional letter
  
  // For the base letters (without wildcards)
  for (const letter of SPANISH_LETTERS) {
    const newBase = baseLetters + letter;
    const alphagram = generateAlphagram(newBase);
    const baseMatches = wordTrie.findAnagrams(alphagram);
    baseMatches
      .filter(word => word.length === expectedLength)
      .forEach(match => matches.add(match));
  }
  
  // If we have wildcards, also search additional combinations
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(baseLetters, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        const newCombo = combo + letter;
        const alphagram = generateAlphagram(newCombo);
        const comboMatches = wordTrie.findAnagrams(alphagram);
        comboMatches
          .filter(word => word.length === expectedLength)
          .forEach(match => matches.add(match));
      }
    }
  }
  
  return matches;
};