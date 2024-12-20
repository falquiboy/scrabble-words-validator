import { TrieNode } from './types';
import { findNode } from './nodeOperations';
import { processDigraphs } from '@/utils/digraphs';
import { convertPatternToRegex, validateWordPattern } from '@/utils/patternMatching';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (trie: { getRoot: () => TrieNode }, pattern: string): string[] => {
  const results: string[] = [];
  const [boardPattern, rackLetters] = pattern.split(',').map(p => p?.trim().toUpperCase());
  
  if (!boardPattern) return results;

  // Process the pattern to handle digraphs
  const processedPattern = processDigraphs(boardPattern);
  console.log('Pattern search:', {
    originalPattern: boardPattern,
    processedPattern,
    rackLetters
  });

  // Create regex for the pattern
  const regex = convertPatternToRegex(processedPattern);
  console.log('Generated regex:', regex);

  // Function to collect all valid words
  const collectWords = (node: TrieNode, currentWord: string = '') => {
    if (node.isEndOfWord) {
      const processedWord = processDigraphs(node.word);
      if (validateWordPattern(processedWord, processedPattern, rackLetters)) {
        results.push(node.word);
      }
    }

    // Continue searching
    for (const [letter, childNode] of node.children) {
      collectWords(childNode, currentWord + letter);
    }
  };

  // Start collection from root
  collectWords(trie.getRoot());
  
  console.log('Pattern search results:', {
    pattern: boardPattern,
    rackLetters,
    matches: results.length,
    words: results
  });

  return Array.from(new Set(results)); // Remove duplicates
};