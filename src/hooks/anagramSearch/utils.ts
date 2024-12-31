import { SPANISH_LETTERS } from './constants';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';
import { Trie } from '@/utils/trie/types';

// Helper function to generate wildcard combinations
export const generateWildcardCombinations = (base: string, remainingWildcards: number): string[] => {
  if (remainingWildcards === 0) return [base];
  
  const combinations: string[] = [];
  for (const letter of SPANISH_LETTERS) {
    // Process the combination immediately
    const newCombo = base + letter;
    combinations.push(...generateWildcardCombinations(newCombo, remainingWildcards - 1));
  }
  return combinations;
};

const findExactMatches = (processedInput: string, trie: Trie): Set<string> => {
  const alphagram = generateAlphagram(processedInput);
  const matches = new Set<string>();
  const words = trie.findAnagrams(alphagram);
  words.forEach(word => matches.add(word));
  return matches;
};

const findWildcardMatches = (processedInput: string, wildcardCount: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  const combinations = generateWildcardCombinations(processedInput, wildcardCount);
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = trie.findAnagrams(alphagram);
    comboMatches.forEach(match => matches.add(match));
  }
  
  return matches;
};

const findShorterMatches = (letters: string, totalLength: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  const letterArray = letters.split('');
  
  // Generate combinations only up to length - 1
  for (let len = 1; len < totalLength; len++) {
    const combinations = generateCombinations(letterArray, len);
    
    for (const combo of combinations) {
      const processedCombo = combo.join('');
      const alphagram = generateAlphagram(processedCombo);
      const comboMatches = trie.findAnagrams(alphagram);
      comboMatches.forEach(match => matches.add(match));
    }
  }
  
  return matches;
};

// Helper function to generate all possible combinations of letters
const generateCombinations = (arr: string[], len: number): string[][] => {
  const result: string[][] = [];
  
  function backtrack(start: number, current: string[]) {
    if (current.length === len) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
};

const findAdditionalMatches = (baseLetters: string, wildcardCount: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  
  // Process base letters first to handle existing digraphs
  const processedBase = processDigraphs(baseLetters);
  
  // For each additional letter, we'll process the combination
  for (const letter of SPANISH_LETTERS) {
    // Important: We add the letter directly without any further digraph processing
    // since processedBase is already in internal format and letter is a single character
    const newCombo = processedBase + letter;
    const alphagram = generateAlphagram(newCombo);
    const baseMatches = trie.findAnagrams(alphagram);
    baseMatches.forEach(match => matches.add(match));
  }
  
  // Handle wildcards similarly
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(processedBase, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        // Same here: direct concatenation without additional processing
        const newCombo = combo + letter;
        const alphagram = generateAlphagram(newCombo);
        const comboMatches = trie.findAnagrams(alphagram);
        comboMatches.forEach(match => matches.add(match));
      }
    }
  }
  
  return matches;
};

export const findAnagrams = (searchTerm: string, trie: Trie, showShorter: boolean = false) => {
  // Count wildcards and process input
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const lettersOnly = searchTerm.replace(/\*/g, '');
  const totalLength = lettersOnly.length + wildcardCount;
  
  // Process digraphs ONCE at the beginning
  const processedInput = processDigraphs(lettersOnly);

  console.log('Processing search:', {
    searchTerm,
    wildcardCount,
    processedInput,
    showShorter
  });

  // Find matches based on wildcards
  const exactMatches = Array.from(wildcardCount === 0 ? 
    findExactMatches(processedInput, trie) : 
    findWildcardMatches(processedInput, wildcardCount, trie)
  );

  // Find additional matches with one more letter
  const additionalWildcardMatches = Array.from(findAdditionalMatches(processedInput, wildcardCount, trie));

  // Find shorter matches if requested, using the total length (including wildcards)
  const shorterMatches = showShorter ? Array.from(findShorterMatches(processedInput, totalLength, trie)) : [];

  return {
    exactMatches,
    wildcardMatches: wildcardCount > 0 ? exactMatches : [],
    additionalWildcardMatches,
    shorterMatches
  };
};