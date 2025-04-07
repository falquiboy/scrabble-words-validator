
import { SPANISH_LETTERS } from "@/hooks/anagramSearch/constants";

/**
 * Generates all possible word combinations that match a pattern using available rack letters
 * Pattern can include fixed letters, ? wildcards, and hyphen notations:
 * - '?' matches exactly one character (from rack or dictionary)
 * - '-' at the start means "ends with the pattern"
 * - '-' at the end means "starts with the pattern" 
 * - '-' at both ends means "contains the pattern"
 */
export const generatePatternCombinations = (
  pattern: string,
  rackLetters: string,
  isStartPattern: boolean = false,
  isEndPattern: boolean = false,
  isContainsPattern: boolean = false
): string[] => {
  // Extract question mark positions and fixed parts
  const questionMarkPositions: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '?' || pattern[i] === '.') {
      questionMarkPositions.push(i);
    }
  }
  
  // Get fixed pattern (without ? or .)
  const fixedPatternChars = pattern
    .replace(/[\?\.]/g, '')
    .split('');
  
  // Parse rack letters and count wildcards
  const rackChars: string[] = [];
  let wildcardCount = 0;
  
  for (const char of rackLetters) {
    if (char === '*') {
      wildcardCount++;
    } else {
      rackChars.push(char);
    }
  }
  
  // Generate combinations based on pattern type
  const combinations: string[] = [];
  
  // Function to recursively generate patterns
  const generateCombinations = (
    currentPattern: string[],
    remainingRack: string[],
    remainingWildcards: number,
    position: number = 0,
    fixedPatternInserted: boolean = false
  ) => {
    // If we've filled all positions, add the combination
    if (position === currentPattern.length) {
      if (fixedPatternInserted) {
        combinations.push(currentPattern.join(''));
      }
      return;
    }
    
    // At the position where fixed pattern should go
    if (!fixedPatternInserted) {
      // For start pattern, fixed pattern goes at the beginning
      if (isStartPattern && position === 0) {
        // Insert fixed pattern
        const newPattern = [...fixedPatternChars, ...Array(currentPattern.length - fixedPatternChars.length).fill('?')];
        generateCombinations(newPattern, remainingRack, remainingWildcards, fixedPatternChars.length, true);
        return;
      }
      
      // For end pattern, fixed pattern goes at the end
      if (isEndPattern && position === currentPattern.length - fixedPatternChars.length) {
        // Insert fixed pattern
        const newPattern = [...currentPattern.slice(0, position), ...fixedPatternChars];
        generateCombinations(newPattern, remainingRack, remainingWildcards, currentPattern.length, true);
        return;
      }
      
      // For contains pattern, fixed pattern can go anywhere except at the very start or very end
      if (isContainsPattern && position > 0 && position < currentPattern.length - fixedPatternChars.length) {
        // Insert fixed pattern at this position
        const newPattern = [
          ...currentPattern.slice(0, position),
          ...fixedPatternChars,
          ...currentPattern.slice(position + fixedPatternChars.length)
        ];
        generateCombinations(newPattern, remainingRack, remainingWildcards, position + fixedPatternChars.length, true);
      }
    }
    
    // If current position has a fixed letter, skip
    if (currentPattern[position] !== '?') {
      generateCombinations(currentPattern, remainingRack, remainingWildcards, position + 1, fixedPatternInserted);
      return;
    }
    
    // Try each available rack letter at this position
    for (let i = 0; i < remainingRack.length; i++) {
      const letter = remainingRack[i];
      const newRack = [...remainingRack.slice(0, i), ...remainingRack.slice(i + 1)];
      const newPattern = [...currentPattern];
      newPattern[position] = letter;
      
      generateCombinations(newPattern, newRack, remainingWildcards, position + 1, fixedPatternInserted);
    }
    
    // Try using a wildcard at this position
    if (remainingWildcards > 0) {
      for (const letter of SPANISH_LETTERS) {
        const newPattern = [...currentPattern];
        newPattern[position] = letter;
        
        generateCombinations(newPattern, remainingRack, remainingWildcards - 1, position + 1, fixedPatternInserted);
      }
    }
  };
  
  // Calculate expected word length based on pattern and available letters
  const calculateWordLength = () => {
    // Start with question marks count plus fixed pattern length
    let baseLength = questionMarkPositions.length + fixedPatternChars.length;
    
    // Add one for each remaining rack letter or wildcard not used in question marks
    const remainingSlots = Math.max(0, rackChars.length + wildcardCount - questionMarkPositions.length);
    
    // For start/end patterns, we need exact length
    // For contains pattern, we can add letters before/after
    if (isContainsPattern) {
      // For contains, use base length plus remaining slots up to a reasonable limit
      return Math.min(baseLength + remainingSlots, 15);
    } else if (isStartPattern || isEndPattern) {
      // For start/end patterns, the word length must account for either prefix or suffix
      return baseLength + remainingSlots;
    } else {
      // For exact patterns, the word length is just the pattern length
      return baseLength;
    }
  };
  
  const wordLength = calculateWordLength();
  
  // Initialize pattern with question marks
  const initialPattern = Array(wordLength).fill('?');
  
  // Start generation
  generateCombinations(initialPattern, rackChars, wildcardCount);
  
  return combinations;
};
