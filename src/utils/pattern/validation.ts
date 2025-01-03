import { processDigraphs } from '@/utils/digraphs';
import { convertPatternToRegex } from './conversion';

export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  // First process the word with digraphs
  const processedWord = processDigraphs(word);
  console.log('Validating pattern:', { word, processedWord, pattern, rackLetters });
  
  if (!rackLetters) {
    const regex = convertPatternToRegex(pattern);
    return regex.test(processedWord);
  }

  // Split pattern into segments
  const segments = pattern.split('-');
  const mainPattern = segments[1] || segments[0]; // Get the main pattern (between dashes)
  
  // Process rack letters
  const processedRack = processDigraphs(rackLetters);
  const availableLetters = new Map<string, number>();
  let wildcards = 0;

  // Count available letters from rack
  for (const letter of processedRack) {
    if (letter === '*') {
      wildcards++;
    } else {
      availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
    }
  }

  // Function to check if we can form a word with given letters
  const canFormWord = (word: string, letters: Map<string, number>, wildcardCount: number): boolean => {
    const letterCount = new Map<string, number>();
    for (const letter of word) {
      letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
    }

    for (const [letter, count] of letterCount.entries()) {
      const available = letters.get(letter) || 0;
      if (available < count) {
        const needed = count - available;
        if (wildcardCount >= needed) {
          wildcardCount -= needed;
        } else {
          return false;
        }
      }
    }
    return true;
  };

  // Check if the word matches the pattern structure
  const regex = convertPatternToRegex(mainPattern);
  if (!regex.test(processedWord)) {
    return false;
  }

  // For patterns with dashes, we need to check each segment
  if (segments.length > 1) {
    const mainPatternStart = pattern.startsWith('-') ? processedWord.indexOf(mainPattern) : 0;
    const mainPatternEnd = mainPatternStart + mainPattern.length;

    // Check prefix (if pattern starts with dash)
    if (pattern.startsWith('-')) {
      const prefix = processedWord.slice(0, mainPatternStart);
      if (!canFormWord(prefix, new Map(availableLetters), wildcards)) {
        return false;
      }
    }

    // Check suffix (if pattern ends with dash)
    if (pattern.endsWith('-')) {
      const suffix = processedWord.slice(mainPatternEnd);
      if (!canFormWord(suffix, new Map(availableLetters), wildcards)) {
        return false;
      }
    }
  }

  // Finally, check if the entire word can be formed with the available letters
  return canFormWord(processedWord, availableLetters, wildcards);
};