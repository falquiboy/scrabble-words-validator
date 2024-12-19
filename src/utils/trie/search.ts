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

  const patternMatches = (word: string, pattern: string): boolean => {
    // Convert the word to internal representation for comparison
    const processedWord = processDigraphs(word);
    
    if (processedWord.length !== processedPattern.length) return false;
    
    for (let i = 0; i < processedPattern.length; i++) {
      if (processedPattern[i] === '?') continue;
      if (processedPattern[i] === '-') continue;
      if (processedPattern[i] !== processedWord[i]) return false;
    }
    
    // If we have a rack, verify we can form the word with available letters
    if (rackLetters) {
      const usedLetters = new Map<string, number>();
      for (let i = 0; i < processedWord.length; i++) {
        if (processedPattern[i] === '?' || processedPattern[i] === '-') {
          const letter = processedWord[i];
          const used = (usedLetters.get(letter) || 0) + 1;
          const available = rackMap.get(letter) || 0;
          if (used > available) return false;
          usedLetters.set(letter, used);
        }
      }
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
      searchRecursive(node, remainingPattern, currentWord); // Zero characters
      for (const [letter, childNode] of node.children) {
        searchRecursive(childNode, currentPattern, currentWord + letter); // Try one more character
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