import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (trie: { getRoot: () => TrieNode }, pattern: string): string[] => {
  const results: string[] = [];
  
  const searchRecursive = (node: TrieNode, pattern: string, currentIndex: number) => {
    if (currentIndex === pattern.length) {
      if (node.isEndOfWord) {
        results.push(node.word);
      }
      return;
    }

    const currentChar = pattern[currentIndex];

    if (currentChar === '?') {
      // Match exactly one character
      for (const [, childNode] of node.children) {
        searchRecursive(childNode, pattern, currentIndex + 1);
      }
    } else if (currentChar === '-') {
      // Match zero or more characters
      // Try matching zero characters (skip the hyphen)
      searchRecursive(node, pattern, currentIndex + 1);
      
      // Try matching one or more characters
      for (const [, childNode] of node.children) {
        searchRecursive(childNode, pattern, currentIndex);
      }
    } else {
      // Match exact character
      const childNode = node.children.get(currentChar);
      if (childNode) {
        searchRecursive(childNode, pattern, currentIndex + 1);
      }
    }
  };

  searchRecursive(trie.getRoot(), pattern, 0);
  return Array.from(new Set(results)); // Remove duplicates
};