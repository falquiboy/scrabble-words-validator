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

const canMakeWordWithRack = (word: string, rackLetters: string, pattern: string): boolean => {
  const rackLettersCopy = [...rackLetters];
  const patternArray = [...pattern];
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

    // For question marks or positions we need to check
    if (patternArray[i] === '?' || isHyphenPattern) {
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