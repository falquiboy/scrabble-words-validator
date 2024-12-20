import { TrieNode } from './types';
import { findNode } from './nodeOperations';
import { processDigraphs } from '@/utils/digraphs';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

// Helper function to check if a word matches a position pattern
const matchesPositionPattern = (word: string, pattern: string): boolean => {
  // If no pattern specified, accept all words
  if (!pattern.includes('-')) return true;

  const wordLength = word.length;
  const parts = pattern.split('-').filter(Boolean);
  
  // Handle different pattern cases
  if (pattern.startsWith('-') && pattern.endsWith('-')) {
    // -ABC- : ABC must be somewhere in the word
    return parts.every(part => word.includes(part));
  }
  
  if (pattern.startsWith('-')) {
    // -ABC : ABC must be at the end
    const endPart = parts[0];
    return word.endsWith(endPart);
  }
  
  if (pattern.endsWith('-')) {
    // ABC- : ABC must be at the start
    const startPart = parts[0];
    return word.startsWith(startPart);
  }
  
  // ABC-DEF : ABC must be at start, DEF at end
  if (parts.length === 2) {
    const [start, end] = parts;
    return word.startsWith(start) && word.endsWith(end);
  }
  
  return false;
};

export const searchPattern = (trie: { getRoot: () => TrieNode }, pattern: string): string[] => {
  const results: string[] = [];
  const [boardPattern, rackLetters] = pattern.split(',').map(p => p?.trim().toUpperCase());
  
  if (!boardPattern) return results;

  // Process the pattern to handle digraphs
  const processedPattern = processDigraphs(boardPattern);
  console.log('Original pattern:', boardPattern);
  console.log('Processed pattern:', processedPattern);
  
  // Extract fixed letters from pattern (non-? characters)
  const fixedLetters = processedPattern.replace(/[-?]/g, '');
  console.log('Fixed letters:', fixedLetters);
  
  // Create rack with fixed letters + available rack letters
  const availableLetters = (fixedLetters + (rackLetters || '')).toUpperCase();
  console.log('Available letters:', availableLetters);

  // First find all valid words that can be formed with the available letters
  const findValidWords = (node: TrieNode, currentWord: string = '', remainingLetters: string) => {
    if (node.isEndOfWord) {
      // Check if the word matches the position pattern
      if (matchesPositionPattern(processDigraphs(node.word), processedPattern)) {
        results.push(node.word);
      }
    }

    // Create a frequency map of remaining letters
    const letterFreq = new Map<string, number>();
    for (const letter of remainingLetters) {
      letterFreq.set(letter, (letterFreq.get(letter) || 0) + 1);
    }

    // Try each possible next letter
    for (const [letter, childNode] of node.children) {
      const available = letterFreq.get(letter) || 0;
      if (available > 0) {
        // Use the letter and update remaining letters
        letterFreq.set(letter, available - 1);
        const newRemaining = Array.from(letterFreq.entries())
          .flatMap(([char, count]) => Array(count).fill(char))
          .join('');
        findValidWords(childNode, currentWord + letter, newRemaining);
        // Restore the letter for backtracking
        letterFreq.set(letter, available);
      }
    }
  };

  // Start the search from root with all available letters
  findValidWords(trie.getRoot(), '', availableLetters);
  
  console.log(`Found ${results.length} matches for pattern "${boardPattern}" with rack "${rackLetters}"`);
  return Array.from(new Set(results)); // Remove duplicates
};