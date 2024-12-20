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

  if (pattern.startsWith('-')) {
    // Pattern like "-ABC" means "ends with ABC"
    const suffix = parts[1].replace(/\?/g, '.');
    return new RegExp(`.*${suffix}$`);
  }

  if (pattern.endsWith('-')) {
    // Pattern like "??V-" means "starts with ??V"
    const prefix = parts[0].replace(/\?/g, '.');
    return new RegExp(`^${prefix}`);
  }

  // For patterns like "A-B" or "-N-", we need to handle middle position constraints
  if (nonEmptyParts.length === 1 && parts.length > 2) {
    // Pattern like "-N-" means "contains N"
    const middle = nonEmptyParts[0].replace(/\?/g, '.');
    return new RegExp(`.*${middle}.*`);
  }

  // Pattern like "A-BC" means "starts with A and ends with BC"
  const [prefix, suffix] = parts;
  return new RegExp(`^${prefix.replace(/\?/g, '.')}.*${suffix.replace(/\?/g, '.')}$`);
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

  // If no rack letters provided, we're done
  if (!rackLetters) return true;

  // Create frequency maps for both the word and available letters
  const availableLetters = new Map<string, number>();
  for (const letter of rackLetters) {
    availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
  }

  // For each letter in the word that's not fixed in the pattern,
  // check if we have it available in our rack
  const patternParts = pattern.split('-');
  const fixedPositions = new Set<number>();
  const fixedLetters = new Set<string>();

  // Mark fixed positions and letters from the pattern
  patternParts.forEach((part, index) => {
    if (part && !/[?-]/.test(part)) {
      // For middle patterns like "-NA-", we need to find where these letters actually appear in the word
      if (index === 1 && patternParts.length === 3) {
        const pos = word.indexOf(part);
        if (pos >= 0) {
          for (let i = 0; i < part.length; i++) {
            fixedPositions.add(pos + i);
            fixedLetters.add(part[i]);
          }
        }
      } else {
        const offset = index === 0 ? 0 : word.indexOf(part);
        if (offset >= 0) {
          for (let i = 0; i < part.length; i++) {
            fixedPositions.add(offset + i);
            fixedLetters.add(part[i]);
          }
        }
      }
    }
  });

  // Check each letter in the word
  for (let i = 0; i < word.length; i++) {
    const wordChar = word[i];
    
    // Skip if this position has a fixed letter in the pattern
    if (fixedPositions.has(i)) {
      // For fixed positions, we don't need to check rack letters
      continue;
    }

    // Check if we have this letter available in the rack
    const count = availableLetters.get(wordChar) || 0;
    if (count === 0) return false;
    
    // Use the letter from the rack
    availableLetters.set(wordChar, count - 1);
  }

  return true;
};