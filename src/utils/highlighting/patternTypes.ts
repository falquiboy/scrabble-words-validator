
/**
 * Defines pattern type detection utilities
 */

import { translateHyphenPattern } from '../pattern/translation';

/**
 * Detects the type of a pattern (start, end, contains)
 */
export interface PatternTypeInfo {
  isStartPattern: boolean;
  isEndPattern: boolean;
  isContainsPattern: boolean;
  cleanPattern: string;
}

export const detectPatternType = (pattern: string): PatternTypeInfo => {
  const translatedPattern = translateHyphenPattern(pattern);
  
  const isStartPattern = translatedPattern.startsWith('^') || pattern.endsWith('-') && !pattern.startsWith('-');
  const isEndPattern = translatedPattern.endsWith('$') || pattern.startsWith('-') && !pattern.endsWith('-');
  const isContainsPattern = pattern.startsWith('-') && pattern.endsWith('-');
  
  // Extract the actual pattern without hyphens for display purposes
  let cleanPattern = pattern;
  if (isEndPattern && !isContainsPattern) {
    cleanPattern = pattern.slice(1);
  }
  if (isStartPattern && !isContainsPattern) {
    cleanPattern = cleanPattern.slice(0, -1);
  }
  if (isContainsPattern) {
    cleanPattern = cleanPattern.slice(1, -1);
  }
  
  return {
    isStartPattern,
    isEndPattern,
    isContainsPattern,
    cleanPattern
  };
};
