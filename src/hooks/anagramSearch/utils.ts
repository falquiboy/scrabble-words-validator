import { SPANISH_LETTERS } from './constants';
import { processDigraphs, generateAlphagram, hasAdjacentDigraphLetters } from '@/utils/digraphs';
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
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = wordTrie.findAnagrams(alphagram);
    comboMatches.forEach(match => matches.add(match));
  }
  
  return matches;
};

export const findAdditionalMatches = (baseLetters: string, wildcardCount: number): Set<string> => {
  const matches = new Set<string>();
  const processedBase = processDigraphs(baseLetters);
  
  // For each possible additional letter
  for (const letter of SPANISH_LETTERS) {
    // Try adding the letter at each position
    for (let i = 0; i <= processedBase.length; i++) {
      const newWord = processedBase.slice(0, i) + letter + processedBase.slice(i);
      const alphagram = generateAlphagram(newWord);
      const baseMatches = wordTrie.findAnagrams(alphagram);
      baseMatches.forEach(match => matches.add(match));
    }
  }
  
  // If we have wildcards, also search additional combinations
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(baseLetters, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        // Try adding the letter at each position
        for (let i = 0; i <= combo.length; i++) {
          const newCombo = combo.slice(0, i) + letter + combo.slice(i);
          const alphagram = generateAlphagram(newCombo);
          const comboMatches = wordTrie.findAnagrams(alphagram);
          comboMatches.forEach(match => matches.add(match));
        }
      }
    }
  }
  
  return matches;
};

const shouldExcludeWord = (word: string, inputDigraphs: ReturnType<typeof hasAdjacentDigraphLetters>): boolean => {
  if (!inputDigraphs.hasRR && word.includes('RR')) return true;
  if (!inputDigraphs.hasLL && word.includes('LL')) return true;
  if (!inputDigraphs.hasCH && word.includes('CH')) return true;
  return false;
};

export const findShorterWords = (processedInput: string): Map<number, Set<string>> => {
  const results = new Map<number, Set<string>>();
  const minLength = 2;
  const inputDigraphs = hasAdjacentDigraphLetters(processedInput);
  
  const generateCombinations = (str: string, length: number, current: string = '', start: number = 0) => {
    if (current.length === length) {
      const alphagram = generateAlphagram(current);
      const words = wordTrie.findAnagrams(alphagram);
      words.forEach(word => {
        if (!shouldExcludeWord(word, inputDigraphs)) {
          if (!results.has(length)) {
            results.set(length, new Set());
          }
          results.get(length)!.add(word);
        }
      });
      return;
    }
    
    // Try each remaining letter
    for (let i = start; i < str.length; i++) {
      // Skip duplicates at the same position
      if (i > start && str[i] === str[i - 1]) continue;
      generateCombinations(str, length, current + str[i], i + 1);
    }
  };
  
  // Generate all possible combinations for each length
  for (let len = processedInput.length - 1; len >= minLength; len--) {
    // Sort the input to handle duplicates correctly
    const sortedInput = [...processedInput].sort().join('');
    generateCombinations(sortedInput, len);
  }
  
  return results;
};