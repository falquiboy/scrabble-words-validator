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

// New optimized function for multiple wildcards
const findMultipleWildcardMatches = (letters: string, wildcardCount: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  const targetLength = letters.length + wildcardCount;
  
  // Get all words of the target length
  const wordsOfLength = trie.getWordsOfLength(targetLength);
  
  // Create array of fixed positions and their letters
  const fixedPositions: { pos: number; letter: string }[] = [];
  let currentPos = 0;
  for (const letter of letters) {
    fixedPositions.push({ pos: currentPos, letter });
    currentPos++;
  }
  
  // Filter words that match our fixed positions
  for (const word of wordsOfLength) {
    let isMatch = true;
    for (const { pos, letter } of fixedPositions) {
      if (word[pos]?.toUpperCase() !== letter.toUpperCase()) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      matches.add(word);
    }
  }
  
  return matches;
};

const findWildcardMatches = (processedInput: string, wildcardCount: number, trie: Trie): Set<string> => {
  // Use optimized approach for multiple wildcards
  if (wildcardCount > 1) {
    console.log('Using optimized multiple wildcards search');
    return findMultipleWildcardMatches(processedInput, wildcardCount, trie);
  }
  
  // Use existing approach for single wildcard
  console.log('Using standard wildcard search');
  const matches = new Set<string>();
  const combinations = generateWildcardCombinations(processedInput, wildcardCount);
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = trie.findAnagrams(alphagram);
    comboMatches.forEach(match => matches.add(match));
  }
  
  return matches;
};

const findShorterMatches = (letters: string, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  const letterArray = letters.split('');
  
  // Generate all possible combinations of letters
  for (let len = 1; len < letters.length; len++) {
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

  // Find shorter matches if requested
  const shorterMatches = showShorter ? Array.from(findShorterMatches(processedInput, trie)) : [];

  return {
    exactMatches,
    wildcardMatches: wildcardCount > 0 ? exactMatches : [],
    additionalWildcardMatches,
    shorterMatches
  };
};