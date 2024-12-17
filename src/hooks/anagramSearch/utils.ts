import { SPANISH_LETTERS } from "./constants";
import { processDigraphs } from "@/utils/digraphs";
import { wordTrie } from "@/utils/trie";

// Helper function to check if a word can be formed from given letters
const canFormWord = (word: string, letters: string): boolean => {
  const letterCount = new Map<string, number>();
  
  // Count available letters
  for (const letter of letters) {
    letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
  }
  
  // Check if we have enough of each letter
  for (const letter of word) {
    const count = letterCount.get(letter) || 0;
    if (count === 0) return false;
    letterCount.set(letter, count - 1);
  }
  
  return true;
};

// Find exact matches (no wildcards)
export const findExactMatches = (letters: string): Set<string> => {
  const matches = new Set<string>();
  const processedLetters = processDigraphs(letters);
  
  // Get words of the same length
  const wordsOfLength = wordTrie.getWordsOfLength(processedLetters.length);
  
  for (const word of wordsOfLength) {
    if (canFormWord(word, processedLetters)) {
      matches.add(word);
    }
  }
  
  return matches;
};

// Find matches using wildcards
export const findWildcardMatches = (processedInput: string, wildcardCount: number): Set<string> => {
  const matches = new Set<string>();
  
  // Remove wildcards for base processing
  const baseLetters = processedInput.replace(/[*?]/g, '');
  
  const combinations = generateWildcardCombinations(baseLetters, {
    asterisks: wildcardCount,
    questionMarks: 0
  });
  
  for (const combo of combinations) {
    const wordsOfLength = wordTrie.getWordsOfLength(combo.length);
    for (const word of wordsOfLength) {
      if (canFormWord(word, combo)) {
        matches.add(word);
      }
    }
  }
  
  return matches;
};

// Find matches with one additional letter
export const findAdditionalMatches = (baseLetters: string, wildcardCount: number): Set<string> => {
  const matches = new Set<string>();
  const processedBase = processDigraphs(baseLetters.replace(/[*?]/g, ''));
  
  // For each possible additional letter
  for (const letter of SPANISH_LETTERS) {
    // Try adding the letter at each position
    for (let i = 0; i <= processedBase.length; i++) {
      const newWord = processedBase.slice(0, i) + letter + processedBase.slice(i);
      const wordsOfLength = wordTrie.getWordsOfLength(newWord.length);
      
      for (const word of wordsOfLength) {
        if (canFormWord(word, newWord)) {
          matches.add(word);
        }
      }
    }
  }
  
  // If we have wildcards, also search additional combinations
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(baseLetters.replace(/[*?]/g, ''), { asterisks: wildcardCount, questionMarks: 0 });
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        // Try adding the letter at each position
        for (let i = 0; i <= combo.length; i++) {
          const newWord = combo.slice(0, i) + letter + combo.slice(i);
          const wordsOfLength = wordTrie.getWordsOfLength(newWord.length);
          
          for (const word of wordsOfLength) {
            if (canFormWord(word, newWord)) {
              matches.add(word);
            }
          }
        }
      }
    }
  }
  
  return matches;
};

// Find shorter words that can be formed
export const findShorterWords = (letters: string): Map<number, Set<string>> => {
  const results = new Map<number, Set<string>>();
  const processedLetters = processDigraphs(letters);
  
  // For each possible length shorter than the input
  for (let len = 2; len < processedLetters.length; len++) {
    const wordsOfLength = wordTrie.getWordsOfLength(len);
    const matches = new Set<string>();
    
    for (const word of wordsOfLength) {
      if (canFormWord(word, processedLetters)) {
        matches.add(word);
      }
    }
    
    if (matches.size > 0) {
      results.set(len, matches);
    }
  }
  
  return results;
};

// Generate all possible combinations with wildcards
export const generateWildcardCombinations = (
  baseLetters: string,
  { asterisks = 0, questionMarks = 0 }
): string[] => {
  const combinations: string[] = [];
  
  const generateCombos = (current: string, remainingAsterisks: number, remainingQuestionMarks: number) => {
    if (remainingAsterisks === 0 && remainingQuestionMarks === 0) {
      combinations.push(current);
      return;
    }
    
    if (remainingAsterisks > 0) {
      for (const letter of SPANISH_LETTERS) {
        generateCombos(current + letter, remainingAsterisks - 1, remainingQuestionMarks);
      }
    }
    
    if (remainingQuestionMarks > 0) {
      for (const letter of SPANISH_LETTERS) {
        generateCombos(current + letter, remainingAsterisks, remainingQuestionMarks - 1);
      }
    }
  };
  
  generateCombos(baseLetters, asterisks, questionMarks);
  return combinations;
};