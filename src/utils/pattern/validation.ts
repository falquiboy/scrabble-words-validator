import { processDigraphs } from '@/utils/digraphs';

/**
 * Validates if a word matches a given pattern and available rack letters
 */
export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  // First check if the word matches the position pattern
  const regex = convertPatternToRegex(pattern);
  const processedWord = processDigraphs(word);
  const processedPattern = processDigraphs(pattern);
  
  if (!regex.test(processedWord)) return false;

  // If no rack letters provided, we're done - the regex match is sufficient
  if (!rackLetters) return true;

  // Process digraphs in rack letters
  const processedRack = processDigraphs(rackLetters);

  // Extract fixed letters from pattern (excluding ? and -)
  const fixedLetters = processedPattern
    .split('-')
    .join('')
    .replace(/\?/g, '')
    .toUpperCase();

  // Create frequency maps for rack letters and handle wildcards
  const availableLetters = new Map<string, number>();
  let wildcardCount = 0;

  for (const letter of processedRack) {
    if (letter === '*') {
      wildcardCount++;
    } else {
      availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
    }
  }

  // Add fixed letters to available letters
  for (const letter of fixedLetters) {
    availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
  }

  // Count letters needed for the word
  const neededLetters = new Map<string, number>();
  for (const letter of processedWord) {
    neededLetters.set(letter, (neededLetters.get(letter) || 0) + 1);
  }

  // Check if we have enough letters, considering wildcards
  let remainingWildcards = wildcardCount;
  for (const [letter, count] of neededLetters) {
    const available = availableLetters.get(letter) || 0;
    if (count > available) {
      // If we don't have enough of this letter, try to use wildcards
      const needed = count - available;
      if (needed > remainingWildcards) return false;
      remainingWildcards -= needed;
    }
  }

  return true;
};

import { convertPatternToRegex } from './conversion';