import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  console.log('Searching with pattern:', pattern, 'and rack:', rackLetters);
  
  // Calculate minimum length required by the pattern - only remove * wildcards since ? requires a character
  const minLength = pattern.replace(/[*]/g, '').length;
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
      return char === '.' ? '\\.' : char; // Escape dots, keep other characters as-is
    })
    .join('');
  
  const regex = new RegExp(`^${regexPattern}$`);
  console.log('Using regex pattern:', regex);
  console.log('Available rack letters:', rackLetters);
  
  const matches = lengthFilteredWords.filter(word => {
    // First check if the word matches the pattern
    const patternMatch = regex.test(word);
    if (patternMatch) {
      console.log('Pattern match found:', word);
      
      // Then check if it can be made with the available rack letters
      const canMake = canMakeWordWithRack(word, pattern, rackLetters);
      if (canMake) {
        console.log('Word can be made with rack:', word);
      }
      return canMake;
    }
    return false;
  });

  console.log('Final matches:', matches);
  return matches;
};

const canMakeWordWithRack = (word: string, pattern: string, rackLetters: string): boolean => {
  const rackArray = rackLetters.split('');
  const wordArray = word.split('');
  const patternArray = pattern.split('');
  
  // For each character in the word
  for (let i = 0; i < wordArray.length; i++) {
    const char = wordArray[i];
    const patternChar = patternArray[i];
    
    // If this position is fixed in the pattern, skip checking rack letters
    if (patternChar !== '?' && patternChar !== '*') {
      continue;
    }
    
    // For wildcards, we need to use a rack letter
    const letterIndex = rackArray.indexOf(char);
    if (letterIndex === -1) {
      // Try to use a wildcard from rack
      const wildcardIndex = rackArray.indexOf('*');
      if (wildcardIndex === -1) {
        return false; // No matching letter or wildcard found
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
  
  return canMakeWordWithRack(word, pattern, rackLetters);
};