import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  return words.filter(word => matchesPattern(word, pattern, rackLetters));
};

const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  // Convert pattern to regex
  const regexPattern = pattern
    .split('')
    .map(char => {
      if (char === '?') return '.'; // ? matches exactly one character
      if (char === '*') return '.*'; // * matches zero or more characters
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
    })
    .join('');
  
  const regex = new RegExp(`^${regexPattern}$`);
  
  // First check if the word matches the pattern
  if (!regex.test(word)) {
    return false;
  }

  // Then check if we can make the word with rack letters
  const rackLettersCopy = rackLetters.split('');
  const wordChars = word.split('');

  // For each character in the word
  for (const char of wordChars) {
    const letterIndex = rackLettersCopy.indexOf(char);
    if (letterIndex === -1) {
      // Check if we have a wildcard (*) in the rack letters
      const wildcardIndex = rackLettersCopy.indexOf('*');
      if (wildcardIndex === -1) {
        return false;
      }
      // Use the wildcard
      rackLettersCopy.splice(wildcardIndex, 1);
    } else {
      // Use the matching letter
      rackLettersCopy.splice(letterIndex, 1);
    }
  }

  return true;
};