
import React from 'react';
import { translateHyphenPattern } from '../pattern/translation';
import { findDigraphPositions } from './digraphUtils';
import { detectPatternType } from './patternTypes';
import { highlightBasedOnPatternType } from './patternHighlighter';

/**
 * Highlight pattern matches with rack letters
 * For patterns like "-NAS,AOL*", highlight the rack letters used to complete the pattern
 */
export const highlightPatternMatch = (word: string, pattern: string, rackLetters: string): React.ReactNode => {
  if (!word || !pattern) return word;
  
  // Process the pattern to handle hyphen notation
  const translatedPattern = translateHyphenPattern(pattern);
  
  // Determine pattern type (starts with, ends with, contains)
  const patternTypeInfo = detectPatternType(pattern);
  
  // Extract the fixed part of the pattern (without notation symbols)
  let fixedPattern = pattern;
  if (patternTypeInfo.isEndPattern) {
    fixedPattern = pattern.replace(/^-/, '');
  } else if (patternTypeInfo.isStartPattern) {
    fixedPattern = pattern.replace(/-$/, '');
  } else if (patternTypeInfo.isContainsPattern) {
    fixedPattern = pattern.replace(/^-|-$/g, '');
  }
  
  // Remove any length filter (e.g., :6)
  fixedPattern = fixedPattern.replace(/:\d+$/, '');
  
  // Find positions of the fixed pattern in the word
  const fixedPatternPos = word.indexOf(fixedPattern);
  
  // Find digraph positions in the original word
  const digraphPositions = findDigraphPositions(word);
  
  // Used to track positions we've processed to avoid duplicates with digraphs
  const processedIndices = new Set<number>();
  
  // Function to check if a character is likely from a wildcard
  const isLikelyWildcard = (char: string) => {
    return rackLetters && 
           rackLetters.includes('*') && 
           !rackLetters.replace(/\*/g, '').toUpperCase().includes(char.toUpperCase());
  };
  
  return (
    <span className="inline-flex">
      {highlightBasedOnPatternType(
        word,
        fixedPattern,
        fixedPatternPos,
        patternTypeInfo,
        digraphPositions,
        processedIndices,
        isLikelyWildcard
      )}
    </span>
  );
};
