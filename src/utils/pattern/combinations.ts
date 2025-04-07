
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
  console.log('Generating combinations for:', {
    pattern, 
    rackLetters, 
    isStartPattern, 
    isEndPattern, 
    isContainsPattern
  });

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
  
  // For contains patterns, we need to generate all possible positions
  if (isContainsPattern) {
    // Generate all possible positions where the pattern could be within the word
    generateContainsPatternWords(
      pattern, 
      rackChars, 
      wildcardCount, 
      combinations
    );
  } else if (isStartPattern) {
    // For start patterns, fixed pattern goes at the beginning
    generateStartPatternWords(
      pattern,
      rackChars,
      wildcardCount,
      combinations
    );
  } else if (isEndPattern) {
    // For end patterns, fixed pattern goes at the end
    generateEndPatternWords(
      pattern,
      rackChars,
      wildcardCount,
      combinations
    );
  } else {
    // For exact patterns
    generateExactPatternWords(
      pattern,
      rackChars,
      wildcardCount,
      combinations
    );
  }
  
  console.log(`Generated ${combinations.length} combinations`);
  return combinations;
};

/**
 * Generate words for patterns that should be contained within the word
 * e.g., -ABC- should match any word containing "ABC"
 */
function generateContainsPatternWords(
  pattern: string,
  rackChars: string[],
  wildcardCount: number,
  combinations: string[]
): void {
  // First, replace any question marks with wildcards or rack letters
  const patternCombinations = generatePatternVariations(pattern, [...rackChars], wildcardCount);
  
  // For each pattern variation, create words that contain it in different positions
  for (const patternVariation of patternCombinations) {
    // Remove the letters used in the pattern from available rack
    const remainingRack = [...rackChars];
    let remainingWildcards = wildcardCount;
    
    for (const char of patternVariation) {
      const rackIndex = remainingRack.indexOf(char);
      if (rackIndex >= 0) {
        remainingRack.splice(rackIndex, 1);
      } else if (remainingWildcards > 0) {
        // Used a wildcard
        remainingWildcards--;
      }
    }
    
    // Now add remaining rack letters in all possible positions around the pattern
    const maxRemainingPositions = remainingRack.length + remainingWildcards;
    
    // Too expensive to try all permutations, so we'll try some common patterns
    // 1. No letters before, all after
    if (maxRemainingPositions > 0) {
      combinations.push(patternVariation + remainingRack.join(''));
    } else {
      combinations.push(patternVariation);
    }
    
    // 2. All letters before, none after
    if (maxRemainingPositions > 0) {
      combinations.push(remainingRack.join('') + patternVariation);
    }
    
    // 3. Split evenly (if we have enough letters)
    if (maxRemainingPositions >= 2) {
      const half = Math.floor(remainingRack.length / 2);
      const firstHalf = remainingRack.slice(0, half).join('');
      const secondHalf = remainingRack.slice(half).join('');
      combinations.push(firstHalf + patternVariation + secondHalf);
    }
    
    // 4. Try with just one letter before/after
    if (remainingRack.length >= 2) {
      combinations.push(remainingRack[0] + patternVariation + remainingRack.slice(1).join(''));
      combinations.push(remainingRack.slice(0, -1).join('') + patternVariation + remainingRack[remainingRack.length - 1]);
    } else if (remainingRack.length === 1) {
      combinations.push(remainingRack[0] + patternVariation);
      combinations.push(patternVariation + remainingRack[0]);
    }
  }
}

/**
 * Generate words for patterns that should be at the start of the word
 * e.g., ABC- should match any word starting with "ABC"
 */
function generateStartPatternWords(
  pattern: string,
  rackChars: string[],
  wildcardCount: number,
  combinations: string[]
): void {
  // First, replace any question marks with wildcards or rack letters
  const patternCombinations = generatePatternVariations(pattern, [...rackChars], wildcardCount);
  
  // For each pattern variation, create words that start with it
  for (const patternVariation of patternCombinations) {
    // Remove the letters used in the pattern from available rack
    const remainingRack = [...rackChars];
    let remainingWildcards = wildcardCount;
    
    for (const char of patternVariation) {
      const rackIndex = remainingRack.indexOf(char);
      if (rackIndex >= 0) {
        remainingRack.splice(rackIndex, 1);
      } else if (remainingWildcards > 0) {
        // Used a wildcard
        remainingWildcards--;
      }
    }
    
    // Now add remaining rack letters after the pattern
    if (remainingRack.length > 0 || remainingWildcards > 0) {
      combinations.push(patternVariation + remainingRack.join(''));
    } else {
      combinations.push(patternVariation);
    }
  }
}

/**
 * Generate words for patterns that should be at the end of the word
 * e.g., -ABC should match any word ending with "ABC"
 */
function generateEndPatternWords(
  pattern: string,
  rackChars: string[],
  wildcardCount: number,
  combinations: string[]
): void {
  // First, replace any question marks with wildcards or rack letters
  const patternCombinations = generatePatternVariations(pattern, [...rackChars], wildcardCount);
  
  // For each pattern variation, create words that end with it
  for (const patternVariation of patternCombinations) {
    // Remove the letters used in the pattern from available rack
    const remainingRack = [...rackChars];
    let remainingWildcards = wildcardCount;
    
    for (const char of patternVariation) {
      const rackIndex = remainingRack.indexOf(char);
      if (rackIndex >= 0) {
        remainingRack.splice(rackIndex, 1);
      } else if (remainingWildcards > 0) {
        // Used a wildcard
        remainingWildcards--;
      }
    }
    
    // Now add remaining rack letters before the pattern
    if (remainingRack.length > 0 || remainingWildcards > 0) {
      combinations.push(remainingRack.join('') + patternVariation);
    } else {
      combinations.push(patternVariation);
    }
  }
}

/**
 * Generate words for exact patterns (no hyphens)
 * e.g., ABC should match only "ABC"
 */
function generateExactPatternWords(
  pattern: string,
  rackChars: string[],
  wildcardCount: number,
  combinations: string[]
): void {
  // For exact patterns, we just need to replace any question marks
  const patternCombinations = generatePatternVariations(pattern, rackChars, wildcardCount);
  combinations.push(...patternCombinations);
}

/**
 * Generate all possible variations of a pattern by filling in question marks
 * with available rack letters or wildcards
 */
function generatePatternVariations(
  pattern: string,
  rackChars: string[],
  wildcardCount: number
): string[] {
  const results: string[] = [];
  
  // Function to recursively fill question marks
  const fillQuestionMarks = (
    currentPattern: string,
    currentRack: string[],
    currentWildcards: number,
    position: number = 0
  ) => {
    // If we've processed the entire pattern, add it to results
    if (position >= currentPattern.length) {
      results.push(currentPattern);
      return;
    }
    
    // If current character isn't a question mark, move to next position
    if (currentPattern[position] !== '?' && currentPattern[position] !== '.') {
      fillQuestionMarks(currentPattern, currentRack, currentWildcards, position + 1);
      return;
    }
    
    // Try using each available rack letter
    for (let i = 0; i < currentRack.length; i++) {
      const newRack = [...currentRack];
      const letter = newRack.splice(i, 1)[0];
      
      const newPattern = 
        currentPattern.substring(0, position) + 
        letter + 
        currentPattern.substring(position + 1);
      
      fillQuestionMarks(newPattern, newRack, currentWildcards, position + 1);
    }
    
    // Try using a wildcard if available
    if (currentWildcards > 0) {
      for (const letter of SPANISH_LETTERS) {
        const newPattern = 
          currentPattern.substring(0, position) + 
          letter + 
          currentPattern.substring(position + 1);
        
        fillQuestionMarks(newPattern, [...currentRack], currentWildcards - 1, position + 1);
      }
    }
  };
  
  fillQuestionMarks(pattern, rackChars, wildcardCount);
  return results;
}
