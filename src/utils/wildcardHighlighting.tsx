
import React from 'react';

/**
 * Highlights letters in a word that match a wildcard pattern
 */
export const highlightPatternMatch = (
  word: string,
  pattern: string,
  rackLetters: string = ''
): React.ReactNode => {
  // Process pattern based on type
  const isEndPattern = pattern.startsWith('-') && !pattern.endsWith('-');
  const isStartPattern = pattern.endsWith('-') && !pattern.startsWith('-');
  const isContainsPattern = pattern.startsWith('-') && pattern.endsWith('-');
  
  // Extract the clean pattern (without hyphens)
  let cleanPattern = pattern;
  if (isEndPattern) {
    cleanPattern = pattern.slice(1);
  } else if (isStartPattern) {
    cleanPattern = pattern.slice(0, -1);
  } else if (isContainsPattern) {
    cleanPattern = pattern.slice(1, -1);
  }
  
  // Replace ? wildcards with . for regex
  const regexPattern = cleanPattern.replace(/\?/g, '.');
  
  // Create the appropriate regex based on pattern type
  let regex: RegExp;
  if (isEndPattern) {
    regex = new RegExp(`${regexPattern}$`, 'i');
  } else if (isStartPattern) {
    regex = new RegExp(`^${regexPattern}`, 'i');
  } else if (isContainsPattern) {
    regex = new RegExp(`${regexPattern}`, 'i');
  } else {
    // Exact match pattern
    regex = new RegExp(`^${regexPattern}$`, 'i');
  }
  
  const match = word.match(regex);
  
  if (!match) {
    // If no match, return the word as is
    return word;
  }
  
  // Get the matched part
  const matchedPart = match[0];
  const matchIndex = match.index || 0;
  const beforeMatch = word.substring(0, matchIndex);
  const afterMatch = word.substring(matchIndex + matchedPart.length);
  
  return (
    <>
      {beforeMatch}
      <span className="font-bold text-blue-600">{matchedPart}</span>
      {afterMatch}
    </>
  );
};
