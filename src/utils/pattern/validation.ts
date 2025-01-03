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

  // Find positions of wildcards and fixed letters in the pattern
  const patternChars = mainPattern.split('');
  const fixedPositions = new Map<number, string>();
  const wildcardPositions = new Set<number>();
  
  patternChars.forEach((char, index) => {
    if (char === '?') {
      wildcardPositions.add(index);
    } else {
      fixedPositions.set(index, char);
    }
  });

  // Find all possible matches in the word
  const regex = convertPatternToRegex(mainPattern);
  const match = regex.exec(processedWord);
  if (!match) return false;

  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;
  const matchedSegment = processedWord.slice(matchStart, matchEnd);

  // Check if wildcards can be satisfied with rack letters
  const remainingLetters = new Map(availableLetters);
  let remainingWildcards = wildcards;

  // First, remove fixed letters from available letters
  for (const [pos, letter] of fixedPositions.entries()) {
    const available = remainingLetters.get(letter) || 0;
    if (available > 0) {
      remainingLetters.set(letter, available - 1);
    } else if (remainingWildcards > 0) {
      remainingWildcards--;
    } else {
      return false;
    }
  }

  // Then check if wildcards can be satisfied with remaining letters
  for (const pos of wildcardPositions) {
    const letter = matchedSegment[pos];
    const available = remainingLetters.get(letter) || 0;
    if (available > 0) {
      remainingLetters.set(letter, available - 1);
    } else if (remainingWildcards > 0) {
      remainingWildcards--;
    } else {
      return false;
    }
  }

  // Check prefix if pattern starts with dash
  if (hasStartDash) {
    const prefix = processedWord.slice(0, matchStart);
    if (!canFormSegment(prefix, new Map(remainingLetters), remainingWildcards)) {
      return false;
    }
  } else if (matchStart > 0) {
    // If no start dash but word has prefix, it's invalid
    return false;
  }

  // Check suffix if pattern ends with dash
  if (hasEndDash) {
    const suffix = processedWord.slice(matchEnd);
    if (!canFormSegment(suffix, new Map(remainingLetters), remainingWildcards)) {
      return false;
    }
  } else if (matchEnd < processedWord.length) {
    // If no end dash but word has suffix, it's invalid
    return false;
  }

  return true;
};