import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  console.log('Searching with pattern:', pattern, 'and rack:', rackLetters);
  return words.filter(word => matchesPattern(word, pattern, rackLetters));
};

export const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  console.log('Testing word:', word, 'against pattern:', pattern);
  
  // Convert pattern to regex
  const regexPattern = pattern
    .split('')
    .map(char => {
      if (char === '?') return '.'; // ? matches exactly one character
      if (char === '*') return '.*'; // * matches zero or more characters
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
    })
    .join('');
  
  console.log('Converted regex pattern:', regexPattern);
  
  const regex = new RegExp(`^${regexPattern}$`);
  const patternMatch = regex.test(word);
  
  console.log('Pattern match result:', patternMatch);
  
  if (!patternMatch) {
    return false;
  }

  // Then check if we can make the word with rack letters
  const rackLettersCopy = rackLetters.split('');
  const wordChars = word.split('');

  console.log('Checking if word can be made with rack letters:', rackLettersCopy);

  // For each character in the word
  for (const char of wordChars) {
    const letterIndex = rackLettersCopy.indexOf(char);
    if (letterIndex === -1) {
      // Check if we have a wildcard (*) in the rack letters
      const wildcardIndex = rackLettersCopy.indexOf('*');
      if (wildcardIndex === -1) {
        console.log('Failed to find letter:', char, 'in rack');
        return false;
      }
      // Use the wildcard
      rackLettersCopy.splice(wildcardIndex, 1);
    } else {
      // Use the matching letter
      rackLettersCopy.splice(letterIndex, 1);
    }
  }

  console.log('Word matches pattern and can be made with rack letters');
  return true;
};