import { SPANISH_LETTERS } from './constants';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';
import { Trie } from '@/utils/trie/types';

export const generateWildcardCombinations = (base: string, remainingWildcards: number): string[] => {
  if (remainingWildcards === 0) return [base];
  
  const combinations: string[] = [];
  for (const letter of SPANISH_LETTERS) {
    // When adding K or W, use them directly as they are already in internal representation
    const newBase = base + letter;
    combinations.push(...generateWildcardCombinations(newBase, remainingWildcards - 1));
  }
  return combinations;
};

const findExactMatches = (processedInput: string, trie: Trie): Set<string> => {
  const alphagram = generateAlphagram(processedInput);
  const matches = new Set<string>();
  const words = trie.getAllWords().filter(word => {
    const wordAlphagram = generateAlphagram(processDigraphs(word));
    return wordAlphagram === alphagram;
  });
  words.forEach(word => matches.add(word));
  return matches;
};

const findWildcardMatches = (processedInput: string, wildcardCount: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  // Generate combinations with already processed input
  const combinations = generateWildcardCombinations(processedInput, wildcardCount);
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = trie.getAllWords().filter(word => {
      const wordAlphagram = generateAlphagram(processDigraphs(word));
      return wordAlphagram === alphagram;
    });
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
      const alphagram = generateAlphagram(combo.join(''));
      const comboMatches = trie.getAllWords().filter(word => {
        const wordAlphagram = generateAlphagram(processDigraphs(word));
        return wordAlphagram === alphagram;
      });
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
  
  // For the base letters (without wildcards)
  for (const letter of SPANISH_LETTERS) {
    // Process the new letter first to handle any potential digraphs
    const processedLetter = processDigraphs(letter);
    const newBase = baseLetters + processedLetter;
    const alphagram = generateAlphagram(newBase);
    const baseMatches = trie.getAllWords().filter(word => {
      const wordAlphagram = generateAlphagram(processDigraphs(word));
      return wordAlphagram === alphagram;
    });
    baseMatches.forEach(match => matches.add(match));
  }
  
  // If we have wildcards, also search additional combinations
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(baseLetters, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        // Process the new letter first to handle any potential digraphs
        const processedLetter = processDigraphs(letter);
        const newCombo = combo + processedLetter;
        const alphagram = generateAlphagram(newCombo);
        const comboMatches = trie.getAllWords().filter(word => {
          const wordAlphagram = generateAlphagram(processDigraphs(word));
          return wordAlphagram === alphagram;
        });
        comboMatches.forEach(match => matches.add(match));
      }
    }
  }
  
  return matches;
};

export const findAnagramsUtil = (searchTerm: string, trie: Trie, showShorter: boolean = false) => {
  // Count wildcards and process input
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const lettersOnly = searchTerm.replace(/\*/g, '');
  // Process digraphs first, before any additional letter handling
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