import { TrieNode } from './types';
import { findNode } from './nodeOperations';
import { processDigraphs } from '@/utils/digraphs';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

// Helper function to check if a word matches a position pattern
const matchesPositionPattern = (word: string, pattern: string): boolean => {
  if (!pattern.includes('-')) return true;

  const parts = pattern.split('-');
  const wordLength = word.length;

  // Handle pattern starting with hyphen (-ABC)
  if (pattern.startsWith('-')) {
    const fixedPart = parts[1];
    const expectedLength = fixedPart.length;
    
    // If pattern is just -V??, we need to check if V is in the correct position
    if (fixedPart.includes('?')) {
      const firstChar = fixedPart[0];
      if (firstChar !== '?') {
        // For pattern like -V??, check if V is in the correct position from the end
        const position = wordLength - fixedPart.length;
        return word[position] === firstChar;
      }
    }
    
    // For exact suffix match
    return word.endsWith(fixedPart.replace(/\?/g, ''));
  }

  // Handle pattern ending with hyphen (ABC-)
  if (pattern.endsWith('-')) {
    const fixedPart = parts[0];
    return word.startsWith(fixedPart.replace(/\?/g, ''));
  }

  // Handle pattern with middle hyphen (A-BC)
  const [start, end] = parts;
  return word.startsWith(start.replace(/\?/g, '')) && 
         word.endsWith(end.replace(/\?/g, ''));
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
      const processedWord = processDigraphs(node.word);
      if (matchesPositionPattern(processedWord, processedPattern)) {
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
  
  console.log('Pattern search results:', {
    pattern: boardPattern,
    rackLetters,
    matches: results.length,
    words: results
  });

  return Array.from(new Set(results)); // Remove duplicates
};