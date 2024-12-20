import { TrieNode } from './types';
import { findNode } from './nodeOperations';
import { processDigraphs } from '@/utils/digraphs';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (trie: { getRoot: () => TrieNode }, pattern: string): string[] => {
  const results: string[] = [];
  const [boardPattern, rackLetters] = pattern.split(',').map(p => p?.trim().toUpperCase());
  
  if (!boardPattern) return results;

  // Process the pattern to handle digraphs (LL -> K, etc)
  const processedPattern = processDigraphs(boardPattern);
  console.log('Original pattern:', boardPattern);
  console.log('Processed pattern:', processedPattern);
  
  // If there's a rack, convert it to a letter frequency map
  const rackMap = new Map<string, number>();
  if (rackLetters) {
    // Process rack letters for digraphs as well
    const processedRack = processDigraphs(rackLetters);
    for (const letter of processedRack) {
      rackMap.set(letter, (rackMap.get(letter) || 0) + 1);
    }
  }

  const MAX_WORD_LENGTH = 15; // Increased to handle longer words
  const MAX_SEQUENCE_LENGTH = 5; // Maximum length to try for each hyphen expansion

  // Helper function to check if we have enough letters in the rack
  const hasEnoughLetters = (word: string, pattern: string, rackLetters: Map<string, number>): boolean => {
    if (!rackLetters.size) return true;

    const remainingLetters = new Map(rackLetters);
    const patternParts = pattern.split('-').filter(Boolean);
    const fixedPositions = new Set<number>();

    // Mark fixed positions from pattern parts
    let currentPos = 0;
    patternParts.forEach(part => {
      const partIndex = word.indexOf(part, currentPos);
      if (partIndex !== -1) {
        for (let i = 0; i < part.length; i++) {
          fixedPositions.add(partIndex + i);
        }
        currentPos = partIndex + part.length;
      }
    });

    // Check if we have enough letters for variable positions
    for (let i = 0; i < word.length; i++) {
      if (fixedPositions.has(i)) continue;

      const letter = word[i];
      const available = remainingLetters.get(letter) || 0;
      if (available <= 0) return false;
      remainingLetters.set(letter, available - 1);
    }

    return true;
  };

  const patternMatches = (word: string, pattern: string): boolean => {
    // Convert the word to internal representation for comparison
    const processedWord = processDigraphs(word);
    
    // Skip words longer than MAX_WORD_LENGTH
    if (processedWord.length > MAX_WORD_LENGTH) return false;

    // For patterns with hyphens, we need to check if the word matches the pattern
    if (pattern.includes('-')) {
      const parts = pattern.split('-').filter(Boolean);
      
      // Handle pattern with hyphens on both ends (e.g., -COMB-)
      if (pattern.startsWith('-') && pattern.endsWith('-')) {
        return parts.length === 1 && 
               processedWord.includes(parts[0]) && 
               hasEnoughLetters(processedWord, pattern, rackMap);
      }
      
      // Handle pattern starting with hyphen (e.g., -EZ)
      if (pattern.startsWith('-')) {
        return processedWord.endsWith(parts[0]) && 
               hasEnoughLetters(processedWord, pattern, rackMap);
      }
      
      // Handle pattern ending with hyphen (e.g., EX-)
      if (pattern.endsWith('-')) {
        return processedWord.startsWith(parts[0]) && 
               hasEnoughLetters(processedWord, pattern, rackMap);
      }
      
      // Handle pattern with hyphen in the middle
      let currentIndex = 0;
      
      for (const part of parts) {
        const processedPart = processDigraphs(part);
        
        // If it's the first part, it must match from the start
        if (parts.indexOf(part) === 0) {
          if (!processedWord.startsWith(processedPart)) return false;
          currentIndex = processedPart.length;
          continue;
        }
        
        // If it's the last part, it must match at the end
        if (parts.indexOf(part) === parts.length - 1) {
          return processedWord.endsWith(processedPart) && 
                 hasEnoughLetters(processedWord, pattern, rackMap);
        }
        
        // For middle parts, find them in order
        const partIndex = processedWord.indexOf(processedPart, currentIndex);
        if (partIndex === -1) return false;
        currentIndex = partIndex + processedPart.length;
      }
      
      return hasEnoughLetters(processedWord, pattern, rackMap);
    }
    
    // For patterns without hyphens, do exact length matching
    if (processedWord.length !== processedPattern.length) return false;
    
    // Create a copy of the rack map for this word check
    const availableLetters = new Map(rackMap);
    
    for (let i = 0; i < processedPattern.length; i++) {
      if (processedPattern[i] === '?') {
        // For wildcards, check if we have the required letter in our rack
        if (rackLetters) {
          const letter = processedWord[i];
          const available = availableLetters.get(letter) || 0;
          if (available <= 0) {
            return false;
          }
          availableLetters.set(letter, available - 1);
        }
        continue;
      }
      if (processedPattern[i] !== processedWord[i]) return false;
    }
    
    return true;
  };

  // New implementation using iterative approach for hyphen expansion
  const searchWords = (node: TrieNode, currentWord: string = '') => {
    // Check if current word is valid
    if (node.isEndOfWord && patternMatches(node.word, boardPattern)) {
      results.push(node.word);
    }

    // Stop if word is too long
    if (currentWord.length >= MAX_WORD_LENGTH) return;

    // Try all possible next letters
    for (const [letter, childNode] of node.children) {
      searchWords(childNode, currentWord + letter);
    }
  };

  // Start the search from root
  searchWords(trie.getRoot());
  
  console.log(`Found ${results.length} matches for pattern "${boardPattern}" with rack "${rackLetters}"`);
  return Array.from(new Set(results)); // Remove duplicates
};