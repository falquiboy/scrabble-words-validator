import { processDigraphs } from '@/utils/digraphs';
import { convertPatternToRegex } from './conversion';

export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  const processedWord = processDigraphs(word);
  
  // Quick regex check
  if (!convertPatternToRegex(pattern).test(processedWord)) {
    return false;
  }

  // If no rack letters provided, pattern match is sufficient
  if (!rackLetters) {
    return true;
  }

  // Process rack letters and count available letters
  const processedRack = processDigraphs(rackLetters);
  const letterCounts = new Map<string, number>();
  let wildcards = 0;

  // Count rack letters
  for (const letter of processedRack) {
    if (letter === '*') {
      wildcards++;
    } else {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }
  }

  // Add fixed pattern letters to available counts
  const fixedLetters = pattern.replace(/[-?]/g, '');
  for (const letter of processDigraphs(fixedLetters)) {
    letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
  }

  // Check if we have enough letters
  for (const letter of processedWord) {
    const count = letterCounts.get(letter) || 0;
    if (count > 0) {
      letterCounts.set(letter, count - 1);
    } else if (wildcards > 0) {
      wildcards--;
    } else {
      return false;
    }
  }

  return true;
};