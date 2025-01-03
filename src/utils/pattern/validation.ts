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

  // Split pattern into segments and remove dashes
  const mainPattern = pattern.replace(/-/g, '');
  const hasStartDash = pattern.startsWith('-');
  const hasEndDash = pattern.endsWith('-');
  
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

  // Function to check if we can form a segment with given letters
  const canFormSegment = (segment: string, letters: Map<string, number>, wildcardCount: number): boolean => {
    const letterCount = new Map<string, number>();
    for (const letter of segment) {
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

  // Find the position of the main pattern in the word
  const regex = convertPatternToRegex(mainPattern);
  const match = regex.exec(processedWord);
  if (!match) return false;

  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;

  // Check prefix if pattern starts with dash
  if (hasStartDash) {
    const prefix = processedWord.slice(0, matchStart);
    if (!canFormSegment(prefix, new Map(availableLetters), wildcards)) {
      return false;
    }
  } else if (matchStart > 0) {
    // If no start dash but word has prefix, it's invalid
    return false;
  }

  // Check suffix if pattern ends with dash
  if (hasEndDash) {
    const suffix = processedWord.slice(matchEnd);
    if (!canFormSegment(suffix, new Map(availableLetters), wildcards)) {
      return false;
    }
  } else if (matchEnd < processedWord.length) {
    // If no end dash but word has suffix, it's invalid
    return false;
  }

  return true;
};