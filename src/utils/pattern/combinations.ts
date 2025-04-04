
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';

/**
 * Generates all possible word combinations that match a pattern
 * using available rack letters
 */
export const generatePatternCombinations = (
  pattern: string,
  rackLetters: string,
  isStartPattern: boolean = false,
  isEndPattern: boolean = false
): string[] => {
  console.log(`Generating pattern combinations with pattern: "${pattern}", isStartPattern: ${isStartPattern}, isEndPattern: ${isEndPattern}`);
  
  // For patterns with special characters (.*), we need to determine
  // what kind of pattern it is and handle it properly
  
  // Extract fixed positions from the pattern (anything that's not a question mark)
  const fixedPositions = new Map<number, string>();
  let questionMarkCount = 0;
  
  // Track the fixed positions and count question marks
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '?') {
      questionMarkCount++;
    } else if (pattern[i] !== '^' && pattern[i] !== '$' && pattern[i] !== '.') {
      fixedPositions.set(i, pattern[i]);
    }
  }
  
  // Count the available rack letters
  const availableLetters = new Map<string, number>();
  let wildcardCount = 0;
  
  for (const char of rackLetters) {
    if (char === '*') {
      wildcardCount++;
    } else {
      availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
    }
  }
  
  // For end patterns (-NAS), generate all possible prefixes using rack letters
  if (isEndPattern && !isStartPattern) {
    const suffix = pattern;
    // Generate all combinations of the rack letters to place before the suffix
    return generatePrefixCombinations(suffix, availableLetters, wildcardCount);
  }
  
  // For start patterns (CON-), generate all possible suffixes using rack letters
  if (isStartPattern && !isEndPattern) {
    const prefix = pattern;
    // Generate all combinations of the rack letters to place after the prefix
    return generateSuffixCombinations(prefix, availableLetters, wildcardCount);
  }
  
  // For middle patterns (-CON-), generate combinations before and after the fixed pattern
  if (isStartPattern && isEndPattern) {
    return generateMiddlePatternCombinations(pattern, availableLetters, wildcardCount);
  }
  
  // For patterns with question marks, we need to fill them with rack letters
  if (questionMarkCount > 0) {
    // Check if we have enough letters to fill the pattern
    const neededLetters = questionMarkCount;
    const availableTotal = Array.from(availableLetters.values()).reduce((a, b) => a + b, 0) + wildcardCount;
    
    if (neededLetters > availableTotal) {
      console.log('Not enough rack letters to fill question marks');
      return [];
    }
    
    // Generate combinations to fill question marks
    return generateQuestionMarkCombinations(pattern, availableLetters, wildcardCount, fixedPositions);
  }
  
  // For exact patterns without question marks, check if it can be formed with the rack letters
  console.log('Checking exact pattern with fixed positions:', Array.from(fixedPositions.entries()));
  
  // If no special handling is needed, just return the pattern as is
  return [pattern];
};

/**
 * Generate all possible prefixes for an end pattern (-NAS)
 * using the available rack letters
 */
const generatePrefixCombinations = (
  suffix: string,
  availableLetters: Map<string, number>,
  wildcardCount: number,
  maxLength: number = 12
): string[] => {
  console.log(`Generating prefix combinations for suffix: "${suffix}"`);
  const combinations: string[] = [];
  
  // Generate combinations of lengths 1 to maxLength
  for (let len = 1; len <= maxLength; len++) {
    // For each length, generate all possible combinations of rack letters
    generatePrefixOfLength(
      "",
      len,
      suffix,
      new Map(availableLetters),
      wildcardCount,
      combinations
    );
  }
  
  return combinations;
};

/**
 * Helper function to generate prefixes of a specific length
 */
const generatePrefixOfLength = (
  currentPrefix: string,
  targetLength: number,
  suffix: string,
  remainingLetters: Map<string, number>,
  remainingWildcards: number,
  result: string[]
): void => {
  // If we've reached the target length, add the prefix + suffix to the result
  if (currentPrefix.length === targetLength) {
    result.push(currentPrefix + suffix);
    return;
  }
  
  // Try using each available letter
  for (const [letter, count] of remainingLetters.entries()) {
    if (count > 0) {
      const newLetters = new Map(remainingLetters);
      newLetters.set(letter, count - 1);
      
      generatePrefixOfLength(
        currentPrefix + letter,
        targetLength,
        suffix,
        newLetters,
        remainingWildcards,
        result
      );
    }
  }
  
  // Try using a wildcard
  if (remainingWildcards > 0) {
    for (const letter of SPANISH_LETTERS) {
      generatePrefixOfLength(
        currentPrefix + letter,
        targetLength,
        suffix,
        new Map(remainingLetters),
        remainingWildcards - 1,
        result
      );
    }
  }
};

/**
 * Generate all possible suffixes for a start pattern (CON-)
 * using the available rack letters
 */
const generateSuffixCombinations = (
  prefix: string,
  availableLetters: Map<string, number>,
  wildcardCount: number,
  maxLength: number = 12
): string[] => {
  console.log(`Generating suffix combinations for prefix: "${prefix}"`);
  const combinations: string[] = [];
  
  // Generate combinations of lengths 1 to maxLength
  for (let len = 1; len <= maxLength; len++) {
    // For each length, generate all possible combinations of rack letters
    generateSuffixOfLength(
      prefix,
      "",
      len,
      new Map(availableLetters),
      wildcardCount,
      combinations
    );
  }
  
  return combinations;
};

/**
 * Helper function to generate suffixes of a specific length
 */
const generateSuffixOfLength = (
  prefix: string,
  currentSuffix: string,
  targetLength: number,
  remainingLetters: Map<string, number>,
  remainingWildcards: number,
  result: string[]
): void => {
  // If we've reached the target length, add the prefix + suffix to the result
  if (currentSuffix.length === targetLength) {
    result.push(prefix + currentSuffix);
    return;
  }
  
  // Try using each available letter
  for (const [letter, count] of remainingLetters.entries()) {
    if (count > 0) {
      const newLetters = new Map(remainingLetters);
      newLetters.set(letter, count - 1);
      
      generateSuffixOfLength(
        prefix,
        currentSuffix + letter,
        targetLength,
        newLetters,
        remainingWildcards,
        result
      );
    }
  }
  
  // Try using a wildcard
  if (remainingWildcards > 0) {
    for (const letter of SPANISH_LETTERS) {
      generateSuffixOfLength(
        prefix,
        currentSuffix + letter,
        targetLength,
        new Map(remainingLetters),
        remainingWildcards - 1,
        result
      );
    }
  }
};

/**
 * Generate combinations for middle patterns (-CON-)
 */
const generateMiddlePatternCombinations = (
  pattern: string,
  availableLetters: Map<string, number>,
  wildcardCount: number,
  maxLength: number = 8
): string[] => {
  console.log(`Generating middle pattern combinations for pattern: "${pattern}"`);
  const combinations: string[] = [];
  
  // We'll need to distribute the available letters before and after the pattern
  // Try different combinations of prefix/suffix lengths
  for (let prefixLen = 1; prefixLen <= maxLength; prefixLen++) {
    for (let suffixLen = 1; suffixLen <= maxLength; suffixLen++) {
      generateMiddlePatternOfLength(
        "",
        pattern,
        "",
        prefixLen,
        suffixLen,
        new Map(availableLetters),
        wildcardCount,
        combinations
      );
    }
  }
  
  return combinations;
};

/**
 * Helper function to generate combinations for middle patterns
 */
const generateMiddlePatternOfLength = (
  currentPrefix: string,
  pattern: string,
  currentSuffix: string,
  prefixLength: number,
  suffixLength: number,
  remainingLetters: Map<string, number>,
  remainingWildcards: number,
  result: string[]
): void => {
  // If we've reached the target prefix length, start generating suffixes
  if (currentPrefix.length === prefixLength) {
    if (currentSuffix.length === suffixLength) {
      // We have a complete word
      result.push(currentPrefix + pattern + currentSuffix);
      return;
    }
    
    // Generate suffix
    for (const [letter, count] of remainingLetters.entries()) {
      if (count > 0) {
        const newLetters = new Map(remainingLetters);
        newLetters.set(letter, count - 1);
        
        generateMiddlePatternOfLength(
          currentPrefix,
          pattern,
          currentSuffix + letter,
          prefixLength,
          suffixLength,
          newLetters,
          remainingWildcards,
          result
        );
      }
    }
    
    // Try using a wildcard for suffix
    if (remainingWildcards > 0) {
      for (const letter of SPANISH_LETTERS) {
        generateMiddlePatternOfLength(
          currentPrefix,
          pattern,
          currentSuffix + letter,
          prefixLength,
          suffixLength,
          new Map(remainingLetters),
          remainingWildcards - 1,
          result
        );
      }
    }
    
    return;
  }
  
  // Generate prefix
  for (const [letter, count] of remainingLetters.entries()) {
    if (count > 0) {
      const newLetters = new Map(remainingLetters);
      newLetters.set(letter, count - 1);
      
      generateMiddlePatternOfLength(
        currentPrefix + letter,
        pattern,
        currentSuffix,
        prefixLength,
        suffixLength,
        newLetters,
        remainingWildcards,
        result
      );
    }
  }
  
  // Try using a wildcard for prefix
  if (remainingWildcards > 0) {
    for (const letter of SPANISH_LETTERS) {
      generateMiddlePatternOfLength(
        currentPrefix + letter,
        pattern,
        currentSuffix,
        prefixLength,
        suffixLength,
        new Map(remainingLetters),
        remainingWildcards - 1,
        result
      );
    }
  }
};

/**
 * Generate combinations for patterns with question marks
 */
const generateQuestionMarkCombinations = (
  pattern: string,
  availableLetters: Map<string, number>,
  wildcardCount: number,
  fixedPositions: Map<number, string>
): string[] => {
  const combinations: string[] = [];
  const patternChars = pattern.split('');
  
  const generateCombinations = (
    currentPattern: string[],
    position: number,
    remainingLetters: Map<string, number>,
    remainingWildcards: number
  ) => {
    // If we've processed the entire pattern, add it to the combinations
    if (position >= currentPattern.length) {
      combinations.push(currentPattern.join(''));
      return;
    }
    
    // If this position is a fixed character or not a question mark, move to the next position
    if (fixedPositions.has(position) || currentPattern[position] !== '?') {
      generateCombinations(
        currentPattern,
        position + 1,
        remainingLetters,
        remainingWildcards
      );
      return;
    }
    
    // This position is a question mark, try filling it with each available letter
    for (const [letter, count] of remainingLetters.entries()) {
      if (count > 0) {
        const newPattern = [...currentPattern];
        newPattern[position] = letter;
        
        const newLetters = new Map(remainingLetters);
        newLetters.set(letter, count - 1);
        
        generateCombinations(
          newPattern,
          position + 1,
          newLetters,
          remainingWildcards
        );
      }
    }
    
    // Try using a wildcard
    if (remainingWildcards > 0) {
      for (const letter of SPANISH_LETTERS) {
        const newPattern = [...currentPattern];
        newPattern[position] = letter;
        
        generateCombinations(
          newPattern,
          position + 1,
          new Map(remainingLetters),
          remainingWildcards - 1,
        );
      }
    }
  };
  
  // Start the combination generation
  generateCombinations(patternChars, 0, availableLetters, wildcardCount);
  
  return combinations;
};
