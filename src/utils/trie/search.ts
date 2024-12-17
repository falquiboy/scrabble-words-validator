import { TrieNode } from './types';
import { findNode } from './nodeOperations';
import { SPANISH_LETTERS, processDigraphs, toDisplayFormat } from '../digraphs';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const processedWord = processDigraphs(word);
  const node = findNode(root, processedWord);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  const processedPattern = processDigraphs(pattern);
  const processedRack = processDigraphs(rackLetters);
  
  // Handle special pattern cases with hyphens
  if (pattern.includes('-')) {
    if (pattern.startsWith('-') && pattern.endsWith('-')) {
      // Substring search: -PAT-
      const substring = processedPattern.slice(1, -1);
      return words
        .map(word => processDigraphs(word))
        .filter(word => 
          word.includes(substring) && 
          canMakeWordWithRack(word, processedRack, processedPattern)
        )
        .map(toDisplayFormat);
    } else if (pattern.startsWith('-')) {
      // Suffix search: -PAT
      const suffix = processedPattern.slice(1);
      return words
        .map(word => processDigraphs(word))
        .filter(word => 
          word.endsWith(suffix) && 
          canMakeWordWithRack(word, processedRack, processedPattern)
        )
        .map(toDisplayFormat);
    } else if (pattern.endsWith('-')) {
      // Prefix search: PAT-
      const prefix = processedPattern.slice(0, -1);
      return words
        .map(word => processDigraphs(word))
        .filter(word => 
          word.startsWith(prefix) && 
          canMakeWordWithRack(word, processedRack, processedPattern)
        )
        .map(toDisplayFormat);
    } else {
      // Pattern with hyphen in middle: e.g. ".N-"
      const parts = processedPattern.split('-');
      const prefix = parts[0];
      
      return words
        .map(word => processDigraphs(word))
        .filter(word => {
          // Check if word starts with the pattern before the hyphen
          if (!matchesExactPattern(word.slice(0, prefix.length), prefix, processedRack)) {
            return false;
          }
          
          // Check if remaining letters can be made with rack
          return canMakeWordWithRack(word.slice(prefix.length), processedRack, '');
        })
        .map(toDisplayFormat);
    }
  }

  // Default pattern matching
  return words
    .map(word => processDigraphs(word))
    .filter(word => matchesPattern(word, processedPattern, processedRack))
    .map(toDisplayFormat);
};

const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  if (word.length !== pattern.length) return false;
  return canMakeWordWithRack(word, rackLetters, pattern);
};

const matchesExactPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  if (word.length !== pattern.length) return false;
  
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '.') {
      // For dot, the letter must be in the rack
      if (!rackLetters.includes(word[i])) return false;
    } else if (pattern[i] === '?') {
      // For question mark, the letter must NOT be in the rack
      if (rackLetters.includes(word[i])) return false;
    } else {
      // For normal letters, must match exactly
      if (pattern[i] !== word[i]) return false;
    }
  }
  
  return true;
};

const canMakeWordWithRack = (word: string, rackLetters: string, pattern: string): boolean => {
  const rackLettersCopy = [...rackLetters];
  const patternArray = [...pattern];

  for (let i = 0; i < word.length; i++) {
    // Skip pattern checking if we're just validating remaining letters
    if (pattern && patternArray[i]) {
      if (patternArray[i] === '.') {
        // For dot, must use a letter from the rack
        const letterIndex = rackLettersCopy.indexOf(word[i]);
        if (letterIndex === -1) return false;
        rackLettersCopy.splice(letterIndex, 1);
        continue;
      }
      if (patternArray[i] === '?') {
        // For question mark, must NOT use a letter from the rack
        if (rackLettersCopy.includes(word[i])) return false;
        continue;
      }
      if (patternArray[i] !== '-' && patternArray[i] !== word[i]) {
        return false;
      }
    }
    
    // For non-pattern letters or after hyphen, just check if we can make it with rack
    if (!pattern || patternArray[i] === '-') {
      const letterIndex = rackLettersCopy.indexOf(word[i]);
      if (letterIndex === -1) return false;
      rackLettersCopy.splice(letterIndex, 1);
    }
  }

  return true;
};