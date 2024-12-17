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
  if (word.length !== pattern.length) return false;

  const rackLettersCopy = rackLetters.split('');
  const patternArray = pattern.split('');

  // First, check if the word matches the pattern
  for (let i = 0; i < word.length; i++) {
    if (patternArray[i] !== '.' && patternArray[i] !== word[i]) {
      return false;
    }
  }

  // Then, check if we can make the word with rack letters
  for (let i = 0; i < word.length; i++) {
    if (patternArray[i] === '.') {
      const letterIndex = rackLettersCopy.indexOf(word[i]);
      if (letterIndex === -1) {
        return false;
      }
      rackLettersCopy.splice(letterIndex, 1);
    }
  }

  return true;
};