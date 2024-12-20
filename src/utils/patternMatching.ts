import { processDigraphs } from "@/utils/digraphs";

/**
 * Converts a pattern like "??V-" into a proper regex pattern
 * that enforces position constraints
 */
export const convertPatternToRegex = (pattern: string): RegExp => {
  // Handle empty pattern
  if (!pattern) return /.*/;

  // Split by hyphen to handle prefix/suffix patterns
  const parts = pattern.split('-');
  
  if (parts.length === 1) {
    // No hyphens, direct conversion
    return new RegExp(`^${pattern.replace(/\?/g, '.')}$`);
  }

  // Filter out empty strings from parts array
  const nonEmptyParts = parts.filter(part => part.length > 0);

  if (nonEmptyParts.length === 0) {
    // Pattern is just hyphens, match anything
    return /.*/;
  }

  // For patterns with hyphens, we need to ensure the fixed letters appear in order
  // with any number of characters in between
  const fixedLettersPattern = nonEmptyParts.map(part => 
    part.replace(/\?/g, '.')
  ).join('.*');

  return new RegExp(`^${fixedLettersPattern}$`);
};

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
  if (!regex.test(word)) return false;

  // If no rack letters provided, we're done - the regex match is sufficient
  if (!rackLetters) return true;

  // Process digraphs in rack letters and word
  const processedRack = processDigraphs(rackLetters);
  const processedWord = processDigraphs(word);
  
  console.log('Pattern validation:', {
    word,
    pattern,
    originalRack: rackLetters,
    processedRack
  });

  // Extract fixed letters from pattern (excluding ? and -)
  const fixedLetters = pattern
    .split('-')
    .join('')
    .replace(/\?/g, '')
    .toUpperCase();
  const processedFixedLetters = processDigraphs(fixedLetters);

  // Create frequency maps for rack letters
  const availableLetters = new Map<string, number>();
  for (const letter of processedRack) {
    availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
  }

  // Add fixed letters to available letters
  for (const letter of processedFixedLetters) {
    availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
  }

  // Count letters needed for the word
  const neededLetters = new Map<string, number>();
  for (const letter of processedWord) {
    neededLetters.set(letter, (neededLetters.get(letter) || 0) + 1);
  }

  // Check if we have enough letters
  for (const [letter, count] of neededLetters) {
    const available = availableLetters.get(letter) || 0;
    if (count > available) return false;
  }

  return true;
};