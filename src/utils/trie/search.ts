import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (trie: { getRoot: () => TrieNode }, pattern: string): string[] => {
  const results: string[] = [];
  const [boardPattern, rackLetters] = pattern.split(',').map(p => p?.trim().toUpperCase());
  
  if (!boardPattern) return results;
  
  // If there's a rack, convert it to a letter frequency map
  const rackMap = new Map<string, number>();
  if (rackLetters) {
    for (const letter of rackLetters) {
      rackMap.set(letter, (rackMap.get(letter) || 0) + 1);
    }
  }

  const searchRecursive = (node: TrieNode, pattern: string, currentIndex: number, usedRackLetters: Map<string, number>) => {
    if (currentIndex === pattern.length) {
      if (node.isEndOfWord) {
        results.push(node.word);
      }
      return;
    }

    const currentChar = pattern[currentIndex];

    if (currentChar === '?') {
      // For ? we need to try all possible letters from the rack
      if (rackLetters) {
        for (const [letter, count] of rackMap) {
          if (count > usedRackLetters.get(letter) || 0) {
            const nextNode = node.children.get(letter);
            if (nextNode) {
              const newUsedLetters = new Map(usedRackLetters);
              newUsedLetters.set(letter, (newUsedLetters.get(letter) || 0) + 1);
              searchRecursive(nextNode, pattern, currentIndex + 1, newUsedLetters);
            }
          }
        }
      } else {
        // If no rack specified, try all possible letters
        for (const [letter, childNode] of node.children) {
          searchRecursive(childNode, pattern, currentIndex + 1, usedRackLetters);
        }
      }
    } else if (currentChar === '-') {
      // Match zero characters (skip the hyphen)
      searchRecursive(node, pattern, currentIndex + 1, usedRackLetters);
      
      // Try matching one or more characters from the rack
      if (rackLetters) {
        for (const [letter, count] of rackMap) {
          if (count > usedRackLetters.get(letter) || 0) {
            const nextNode = node.children.get(letter);
            if (nextNode) {
              const newUsedLetters = new Map(usedRackLetters);
              newUsedLetters.set(letter, (newUsedLetters.get(letter) || 0) + 1);
              // Continue searching with the same pattern position to allow multiple letters
              searchRecursive(nextNode, pattern, currentIndex, newUsedLetters);
            }
          }
        }
      } else {
        // If no rack specified, try all possible letters
        for (const [, childNode] of node.children) {
          searchRecursive(childNode, pattern, currentIndex, usedRackLetters);
        }
      }
    } else {
      // Match exact character from the board
      const childNode = node.children.get(currentChar);
      if (childNode) {
        searchRecursive(childNode, pattern, currentIndex + 1, usedRackLetters);
      }
    }
  };

  searchRecursive(trie.getRoot(), boardPattern, 0, new Map());
  return Array.from(new Set(results)); // Remove duplicates
};