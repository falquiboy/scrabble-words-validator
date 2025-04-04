
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';

/**
 * Generates all possible word combinations that match a pattern
 * using available rack letters
 */
export const generatePatternCombinations = (
  pattern: string,
  rackLetters: string
): string[] => {
  // Extract fixed positions from the pattern (anything that's not a question mark)
  const fixedPositions = new Map<number, string>();
  let questionMarkCount = 0;
  
  // Track the fixed positions and count question marks
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '?') {
      questionMarkCount++;
    } else if (pattern[i] !== '^' && pattern[i] !== '$') {
      fixedPositions.set(i, pattern[i]);
    }
  }
  
  // Parse start and end constraints
  const startsWith = pattern.startsWith('^') ? pattern.charAt(1) : '';
  const endsWith = pattern.endsWith('$') ? pattern.charAt(pattern.length - 2) : '';
  
  // Add start/end constraints to fixed positions if they exist
  if (startsWith) {
    fixedPositions.set(0, startsWith);
  }
  if (endsWith) {
    fixedPositions.set(pattern.length - 1, endsWith);
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
  
  // Check if we have enough letters to fill the pattern
  // Fixed letters in the pattern don't need to be in the rack
  // Question marks need to be filled with rack letters or wildcards
  if (questionMarkCount > (rackLetters.length + wildcardCount)) {
    console.log('Not enough rack letters to fill the pattern');
    return [];
  }
  
  console.log('Generating pattern combinations with:', {
    pattern,
    fixedPositions: Array.from(fixedPositions.entries()),
    questionMarkCount,
    availableLetters: Array.from(availableLetters.entries()),
    wildcardCount
  });
  
  const combinations: string[] = [];
  
  // Create a blank word template with the same length as the pattern
  // (excluding ^ and $ if present)
  let effectiveLength = pattern.length;
  if (pattern.startsWith('^')) effectiveLength--;
  if (pattern.endsWith('$')) effectiveLength--;
  
  const wordTemplate = Array(effectiveLength).fill('');
  
  // Fill in the fixed positions from the pattern
  fixedPositions.forEach((letter, position) => {
    wordTemplate[position] = letter;
  });
  
  // Find positions that need to be filled (question marks)
  const positionsToFill: number[] = [];
  for (let i = 0; i < wordTemplate.length; i++) {
    if (wordTemplate[i] === '') {
      positionsToFill.push(i);
    }
  }
  
  // Helper function to check if a combination is valid
  const isValidCombination = (word: string[]): boolean => {
    // Check fixed positions from the pattern
    for (const [pos, letter] of fixedPositions.entries()) {
      if (word[pos] !== letter) return false;
    }
    
    // Check start/end constraints
    if (startsWith && word[0] !== startsWith) return false;
    if (endsWith && word[word.length - 1] !== endsWith) return false;
    
    return true;
  };
  
  // Generate all combinations recursively
  const generateCombinations = (
    currentWord: string[],
    remainingPositions: number[],
    remainingLetters: Map<string, number>,
    remainingWildcards: number
  ) => {
    // Base case: all positions filled
    if (remainingPositions.length === 0) {
      if (isValidCombination(currentWord)) {
        combinations.push(currentWord.join(''));
      }
      return;
    }
    
    // Get the current position to fill
    const currentPosition = remainingPositions[0];
    const nextPositions = remainingPositions.slice(1);
    
    // Try using each available letter
    for (const [letter, count] of remainingLetters.entries()) {
      if (count > 0) {
        // Use this letter at the current position
        const newWord = [...currentWord];
        newWord[currentPosition] = letter;
        
        // Update remaining letters
        const newRemainingLetters = new Map(remainingLetters);
        newRemainingLetters.set(letter, count - 1);
        
        // Continue with next position
        generateCombinations(
          newWord,
          nextPositions,
          newRemainingLetters,
          remainingWildcards
        );
      }
    }
    
    // Try using a wildcard if available
    if (remainingWildcards > 0) {
      // With a wildcard, we can use any letter in the alphabet
      for (const letter of SPANISH_LETTERS) {
        const newWord = [...currentWord];
        newWord[currentPosition] = letter;
        
        // Continue with next position (wildcard count reduced)
        generateCombinations(
          newWord,
          nextPositions,
          new Map(remainingLetters),
          remainingWildcards - 1
        );
      }
    }
  };
  
  // Start the combination generation
  generateCombinations(wordTemplate, positionsToFill, availableLetters, wildcardCount);
  
  console.log(`Generated ${combinations.length} combinations`);
  return combinations;
};
