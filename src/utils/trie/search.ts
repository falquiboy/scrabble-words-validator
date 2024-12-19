import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  console.log('Searching with pattern:', pattern, 'and rack:', rackLetters);
  
  // Calculate minimum length required by the pattern
  const minLength = pattern.replace(/[*?]/g, '').length;
  console.log('Minimum length required:', minLength);
  
  // Filter words by minimum length first
  const lengthFilteredWords = words.filter(word => word.length >= minLength);
  console.log('Words after length filtering:', lengthFilteredWords.length);
  
  // Create a more precise regex pattern
  const regexPattern = pattern
    .split('')
    .map(char => {
      if (char === '?') return '[A-ZÑ]'; // Single character wildcard
      if (char === '*') return '[A-ZÑ]*'; // Multiple character wildcard
      return char;
    })
    .join('');
  
  const regex = new RegExp(`^${regexPattern}$`);
  console.log('Using regex pattern:', regex);
  console.log('Available rack letters:', rackLetters);
  
  const matches = lengthFilteredWords.filter(word => {
    const patternMatch = regex.test(word);
    if (patternMatch) {
      console.log('Pattern match found:', word);
    }
    if (!patternMatch) return false;
    
    // Check if word can be made with rack letters
    const canMake = canMakeWordWithRack(word, rackLetters);
    if (canMake) {
      console.log('Word can be made with rack:', word);
    }
    return canMake;
  });

  console.log('Final matches:', matches);
  return matches;
};

const canMakeWordWithRack = (word: string, rackLetters: string): boolean => {
  const rackArray = rackLetters.split('');
  const wordArray = word.split('');
  
  for (const char of wordArray) {
    const letterIndex = rackArray.indexOf(char);
    if (letterIndex === -1) {
      // Try to use a wildcard
      const wildcardIndex = rackArray.indexOf('*');
      if (wildcardIndex === -1) {
        return false;
      }
      // Use the wildcard
      rackArray.splice(wildcardIndex, 1);
    } else {
      // Use the matching letter
      rackArray.splice(letterIndex, 1);
    }
  }
  
  return true;
};

export const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  // Create regex pattern with proper handling of special characters
  const regexPattern = pattern
    .split('')
    .map(char => {
      if (char === '?') return '[A-ZÑ]';
      if (char === '*') return '[A-ZÑ]*';
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  
  const regex = new RegExp(`^${regexPattern}$`);
  const patternMatch = regex.test(word);
  
  if (!patternMatch) return false;
  
  return canMakeWordWithRack(word, rackLetters);
};