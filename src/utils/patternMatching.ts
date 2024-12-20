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
  for (let i = 0; i < word.length; i++) {
    const patternChar = pattern[i] || '-';
    const wordChar = word[i];

    // Skip if this position has a fixed letter in the pattern
    if (patternChar !== '?' && patternChar !== '-') continue;

    // Check if we have this letter available
    const count = availableLetters.get(wordChar) || 0;
    if (count === 0) return false;
    
    // Use the letter
    availableLetters.set(wordChar, count - 1);
  }

  return true;
};