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

  const MAX_WORD_LENGTH = 10;

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
        return parts.length === 1 && processedWord.includes(parts[0]);
      }
      
      // Handle pattern starting with hyphen (e.g., -EZ)
      if (pattern.startsWith('-')) {
        return processedWord.endsWith(parts[0]);
      }
      
      // Handle pattern ending with hyphen (e.g., EX-)
      if (pattern.endsWith('-')) {
        return processedWord.startsWith(parts[0]);
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
          return processedWord.endsWith(processedPart);
        }
        
        // For middle parts, find them in order
        const partIndex = processedWord.indexOf(processedPart, currentIndex);
        if (partIndex === -1) return false;
        currentIndex = partIndex + processedPart.length;
      }
      
      return true;
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

  const searchRecursive = (node: TrieNode, currentPattern: string, currentWord: string) => {
    if (currentPattern.length === 0) {
      if (node.isEndOfWord && patternMatches(node.word, boardPattern)) {
        results.push(node.word);
      }
      return;
    }

    const currentChar = currentPattern[0];
    const remainingPattern = currentPattern.slice(1);

    if (currentChar === '?') {
      // For ? we try all possible next letters
      for (const [letter, childNode] of node.children) {
        searchRecursive(childNode, remainingPattern, currentWord + letter);
      }
    } else if (currentChar === '-') {
      // Match zero or more characters
      // Try zero characters
      searchRecursive(node, remainingPattern, currentWord);
      
      // Try one or more characters
      for (const [letter, childNode] of node.children) {
        searchRecursive(childNode, currentPattern, currentWord + letter);
      }
    } else {
      // Match exact character
      const childNode = node.children.get(currentChar);
      if (childNode) {
        searchRecursive(childNode, remainingPattern, currentWord + currentChar);
      }
    }
  };

  searchRecursive(trie.getRoot(), processedPattern, '');
  return Array.from(new Set(results)); // Remove duplicates
};