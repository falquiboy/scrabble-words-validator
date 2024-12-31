import { processDigraphs } from '@/utils/digraphs';
import { convertPatternToRegex } from './conversion';

export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  // Process word once
  const processedWord = processDigraphs(word);
  
  // Quick regex check first
  const regex = convertPatternToRegex(pattern);
  if (!regex.test(processedWord)) return false;

  // If no rack letters, we're done
  if (!rackLetters) return true;

  // Process rack letters once
  const processedRack = processDigraphs(rackLetters);
  
  // Count available letters (including wildcards)
  const available = new Map<string, number>();
  let wildcards = 0;

  for (const letter of processedRack) {
    if (letter === '*') {
      wildcards++;
    } else {
      available.set(letter, (available.get(letter) || 0) + 1);
    }
  }

  // Add fixed pattern letters to available
  const fixedLetters = pattern.replace(/[-?]/g, '');
  for (const letter of processDigraphs(fixedLetters)) {
    available.set(letter, (available.get(letter) || 0) + 1);
  }

  // Check if we have enough letters
  for (const letter of processedWord) {
    const count = available.get(letter) || 0;
    if (count > 0) {
      available.set(letter, count - 1);
    } else if (wildcards > 0) {
      wildcards--;
    } else {
      return false;
    }
  }

  return true;
};