import { TrieNode } from './types';
import { findNode } from './nodeOperations';

export const searchExact = (root: TrieNode, word: string): boolean => {
  const node = findNode(root, word);
  return node !== null && node.isEndOfWord;
};

export const searchPattern = (words: string[], pattern: string, rackLetters: string): string[] => {
  // Handle special pattern cases with hyphens
  if (pattern.includes('-')) {
    if (pattern.startsWith('-') && pattern.endsWith('-')) {
      // Substring search: -PAT-
      const substring = pattern.slice(1, -1);
      return words.filter(word => 
        word.includes(substring) && 
        canMakeWordWithRack(word, rackLetters, pattern)
      );
    } else if (pattern.startsWith('-')) {
      // Suffix search: -PAT
      const suffix = pattern.slice(1);
      return words.filter(word => 
        word.endsWith(suffix) && 
        canMakeWordWithRack(word, rackLetters, pattern)
      );
    } else if (pattern.endsWith('-')) {
      // Prefix search: PAT-
      const prefix = pattern.slice(0, -1);
      return words.filter(word => 
        word.startsWith(prefix) && 
        canMakeWordWithRack(word, rackLetters, pattern)
      );
    }
  }

  // Default pattern matching (existing functionality)
  return words.filter(word => matchesPattern(word, pattern, rackLetters));
};

const matchesPattern = (word: string, pattern: string, rackLetters: string): boolean => {
  // Handle basic pattern case (no hyphens)
  if (word.length !== pattern.length) return false;

  return canMakeWordWithRack(word, rackLetters, pattern);
};

const canMakeWordWithRack = (word: string, rackLetters: string, pattern: string): boolean => {
  const rackLettersCopy = rackLetters.split('');
  const patternArray = pattern.split('');
  const isHyphenPattern = pattern.includes('-');

  // For hyphen patterns, we only need to check the non-fixed positions
  for (let i = 0; i < word.length; i++) {
    if (isHyphenPattern) {
      // Skip checking positions that are covered by hyphens
      if (pattern.startsWith('-') && i < pattern.length - 1) continue;
      if (pattern.endsWith('-') && i >= pattern.indexOf('-')) continue;
      if (pattern.startsWith('-') && pattern.endsWith('-')) {
        const substring = pattern.slice(1, -1);
        const startIdx = word.indexOf(substring);
        if (i < startIdx || i >= startIdx + substring.length) continue;
      }
    }

    // For dots or positions we need to check
    if (patternArray[i] === '.' || isHyphenPattern) {
      const letterIndex = rackLettersCopy.indexOf(word[i]);
      if (letterIndex === -1) {
        return false;
      }
      rackLettersCopy.splice(letterIndex, 1);
    } else if (patternArray[i] !== word[i]) {
      return false;
    }
  }

  return true;
};