
import { processDigraphs } from '@/utils/digraphs';
import { convertPatternToRegex } from './conversion';

/**
 * Validates if a word matches a pattern and can be built using the available rack letters
 */
export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  // First process the word with digraphs
  const processedWord = processDigraphs(word);
  
  // For the pattern, we need to handle special characters differently
  // We'll split the pattern into parts that should and shouldn't be processed
  const parts = pattern.split(/([?^$\-])/);
  const processedParts = parts.map(part => {
    // Don't process special characters
    if (part === '?' || part === '^' || part === '$' || part === '-') return part;
    // Process other parts for digraphs
    return processDigraphs(part);
  });
  const processedPattern = processedParts.join('');

  // Quick regex check using the processed pattern
  const regex = convertPatternToRegex(processedPattern);
  
  if (!regex.test(processedWord)) {
    return false;
  }

  // If no rack letters provided, pattern match is sufficient
  if (!rackLetters || rackLetters.trim() === '') {
    return true;
  }

  // For pattern search with rack letters, we need to verify that:
  // 1. The entire word can be formed using the available rack letters
  // 2. Fixed characters in the pattern are considered "free" (don't count against rack)
  
  // Count the letters in the word
  const wordLetterCount = new Map<string, number>();
  for (const char of processedWord) {
    wordLetterCount.set(char, (wordLetterCount.get(char) || 0) + 1);
  }
  
  // Count letters in rack
  const rackLetterCount = new Map<string, number>();
  const processedRack = processDigraphs(rackLetters);
  let wildcardCount = 0;
  
  // Count rack letters and wildcards
  for (const char of processedRack) {
    if (char === '*') {
      wildcardCount++;
    } else {
      rackLetterCount.set(char, (rackLetterCount.get(char) || 0) + 1);
    }
  }
  
  // Check if we have enough letters to form the word
  for (const [letter, count] of wordLetterCount.entries()) {
    const availableCount = rackLetterCount.get(letter) || 0;
    
    if (availableCount < count) {
      // We don't have enough of this letter, check if we can use wildcards
      const deficit = count - availableCount;
      if (wildcardCount >= deficit) {
        wildcardCount -= deficit;
      } else {
        // Not enough wildcards to make up for the deficit
        return false;
      }
    } else {
      // We have enough of this letter
      rackLetterCount.set(letter, availableCount - count);
    }
  }
  
  // If we got here, we have enough letters to form the word
  return true;
};
