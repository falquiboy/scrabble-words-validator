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
  const regexStr = '^' + pattern
    .split('')
    .map(char => {
      if (char === '?') return '[A-ZÑ]';
      if (char === '*') return '[A-ZÑ]*';
      return char; // Keep fixed characters as-is
    })
    .join('') + '$';
  
  const regex = new RegExp(regexStr);
  console.log('Using regex pattern:', regexStr);
  console.log('Available rack letters:', rackLetters);
  
  // Keep track of matches for debugging
  const patternMatches: string[] = [];
  const rackMatches: string[] = [];
  
  const matches = lengthFilteredWords.filter(word => {
    // First check pattern match
    const patternMatch = regex.test(word);
    if (patternMatch) {
      patternMatches.push(word);
      console.log('Pattern match found:', word);
      
      // Then verify if it can be made with rack letters
      const canMake = canMakeWordWithRack(word, pattern, rackLetters);
      if (canMake) {
        rackMatches.push(word);
        console.log('Word can be made with rack:', word);
      }
      return canMake;
    }
    return false;
  });

  // Log detailed results
  console.log('Words matching pattern:', patternMatches);
  console.log('Words matching pattern AND rack:', rackMatches);
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
    const patternChar = i < patternArray.length ? patternArray[i] : '?';
    
    // Skip checking rack letters for fixed pattern positions
    if (patternChar !== '?' && patternChar !== '*') {
      if (char !== patternChar) {
        console.log(`Character mismatch at position ${i}: expected ${patternChar}, got ${char}`);
        return false;
      }
      continue;
    }
    
    // For wildcards, we need to use a rack letter
    const letterIndex = rackArray.indexOf(char);
    if (letterIndex === -1) {
      // Try to use a wildcard from rack
      const wildcardIndex = rackArray.indexOf('*');
      if (wildcardIndex === -1) {
        console.log(`Cannot make word: missing letter ${char} in rack`);
        return false;
      }
      rackArray.splice(wildcardIndex, 1);
    } else {
      rackArray.splice(letterIndex, 1);
    }
  }
  
  return true;
};

export const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  const regexPattern = pattern
    .split('')
    .map(char => {
      if (char === '?') return '[A-ZÑ]';
      if (char === '*') return '[A-ZÑ]*';
      return char;
    })
    .join('');
  
  const regex = new RegExp(`^${regexPattern}$`);
  const patternMatch = regex.test(word);
  
  if (!patternMatch) return false;
  
  return canMakeWordWithRack(word, pattern, rackLetters);
};
