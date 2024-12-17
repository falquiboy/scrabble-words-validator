import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  console.log('Searching with pattern:', pattern, 'and rack:', rackLetters);
  
  // Calculate minimum length required by the pattern
  const minLength = pattern.replace(/\*/g, '').length;
  console.log('Minimum length required:', minLength);
  
  // Filter words by minimum length first
  const lengthFilteredWords = words.filter(word => word.length >= minLength);
  console.log('Words after length filtering:', lengthFilteredWords.length);
  
  return lengthFilteredWords.filter(word => matchesPattern(word, pattern, rackLetters));
};

export const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  console.log('Testing word:', word, 'against pattern:', pattern);
  
  // Convert pattern to regex, handling the special case of * at the start
  const regexPattern = pattern
    .split('')
    .map(char => {
      if (char === '?') return '.';
      if (char === '*') return '.*';
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  
  console.log('Converted regex pattern:', regexPattern);
  
  // Create regex with proper anchoring
  const regex = new RegExp(`^${regexPattern}$`);
  const patternMatch = regex.test(word);
  
  console.log('Pattern match result for', word, ':', patternMatch);
  
  if (!patternMatch) {
    return false;
  }

  // Then check if we can make the word with rack letters
  const rackLettersCopy = rackLetters.split('');
  const wordChars = word.split('');

  console.log('Checking if word', word, 'can be made with rack letters:', rackLettersCopy);

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

  console.log('Word', word, 'matches pattern and can be made with rack letters');
  return true;
};