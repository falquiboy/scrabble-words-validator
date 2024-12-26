import { SPANISH_LETTERS } from './constants';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';
import { Trie } from '@/utils/trie/types';

// Helper function to check if a letter combination would form a digraph
const wouldFormDigraph = (base: string, newLetter: string): boolean => {
  const combinations = {
    'C': ['H'],
    'L': ['L'],
    'R': ['R']
  };
  
  const lastChar = base.charAt(base.length - 1);
  return combinations[lastChar]?.includes(newLetter) || false;
};

export const generateWildcardCombinations = (base: string, remainingWildcards: number): string[] => {
  if (remainingWildcards === 0) return [base];
  
  const combinations: string[] = [];
  for (const letter of SPANISH_LETTERS) {
    // Skip if this would form an invalid digraph
    if (wouldFormDigraph(base, letter)) continue;
    
    // Process the combination immediately to handle digraphs properly
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
    // Process digraphs after all letters are combined
    const processedCombo = processDigraphs(combo);
    const alphagram = generateAlphagram(processedCombo);
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
      // Skip combinations that would form invalid digraphs
      let isValidCombo = true;
      for (let i = 0; i < combo.length - 1; i++) {
        if (wouldFormDigraph(combo[i], combo[i + 1])) {
          isValidCombo = false;
          break;
        }
      }
      if (!isValidCombo) continue;

      // Process digraphs after combining letters
      const processedCombo = processDigraphs(combo.join(''));
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
      // Skip if this would form an invalid digraph with the last letter
      if (current.length > 0 && wouldFormDigraph(current[current.length - 1], arr[i])) {
        continue;
      }
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
    // Skip if this would form an invalid digraph with the last letter of the base
    if (wouldFormDigraph(baseLetters, letter)) continue;

    // Process the entire combination to handle digraphs properly
    const newCombo = processDigraphs(processedBase + letter);
    // Skip if the processed combination is the same length as the base
    // This means the additional letter formed a digraph with the base letters
    if (newCombo.length === processedBase.length) continue;
    
    const alphagram = generateAlphagram(newCombo);
    const baseMatches = trie.findAnagrams(alphagram);
    baseMatches.forEach(match => matches.add(match));
  }
  
  // Handle wildcards similarly
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(processedBase, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        // Skip if this would form an invalid digraph
        if (wouldFormDigraph(combo, letter)) continue;

        // Process the entire combination to handle digraphs properly
        const newCombo = processDigraphs(combo + letter);
        // Skip if the processed combination indicates a digraph was formed
        if (newCombo.length === combo.length) continue;
        
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