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
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = wordTrie.findAnagrams(alphagram);
    comboMatches.forEach(match => matches.add(match));
  }
  
  return matches;
};

export const findAdditionalMatches = (baseLetters: string, wildcardCount: number): Set<string> => {
  const matches = new Set<string>();
  
  // For the base letters (without wildcards)
  for (const letter of SPANISH_LETTERS) {
    const newBase = baseLetters + letter;
    const alphagram = generateAlphagram(newBase);
    const baseMatches = wordTrie.findAnagrams(alphagram);
    baseMatches.forEach(match => matches.add(match));
  }
  
  // If we have wildcards, also search additional combinations
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(baseLetters, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        const newCombo = combo + letter;
        const alphagram = generateAlphagram(newCombo);
        const comboMatches = wordTrie.findAnagrams(alphagram);
        comboMatches.forEach(match => matches.add(match));
      }
    }
  }
  
  return matches;
};

export const findShorterWords = (processedInput: string): Map<number, Set<string>> => {
  const results = new Map<number, Set<string>>();
  const minLength = 2; // Changed from Math.max(2, processedInput.length - 2) to allow all words >= 2 letters
  
  // Generate all possible combinations of letters for each length
  for (let len = processedInput.length - 1; len >= minLength; len--) {
    const matches = new Set<string>();
    
    // Generate all possible combinations of the given length
    const generateCombinations = (str: string, length: number, current: string = '', start: number = 0) => {
      if (current.length === length) {
        const alphagram = generateAlphagram(current);
        const words = wordTrie.findAnagrams(alphagram);
        words.forEach(word => matches.add(word));
        return;
      }
      
      for (let i = start; i < str.length; i++) {
        generateCombinations(str, length, current + str[i], i + 1);
      }
    };
    
    generateCombinations(processedInput, len);
    
    if (matches.size > 0) {
      results.set(len, matches);
    }
  }
  
  return results;
};