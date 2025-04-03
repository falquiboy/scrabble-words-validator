
/**
 * Translates hyphen-based patterns into regex-compatible patterns
 * -CON → .*CON$ (ends with CON)
 * CON- → ^CON.* (starts with CON)
 * -CON- → (?!^CON).*CON(?!.*$).* (contains CON, but not at start or end)
 */
export const translateHyphenPattern = (pattern: string): string => {
  // Clean the pattern first
  const cleanPattern = pattern.trim();
  
  // Handle empty or invalid patterns
  if (!cleanPattern || cleanPattern === '-') {
    return pattern;
  }

  // Handle the three main cases
  if (cleanPattern.startsWith('-') && cleanPattern.endsWith('-')) {
    // -CON- → Match words containing the pattern, but not at start or end
    const innerPattern = cleanPattern.slice(1, -1);
    if (!innerPattern) return pattern;
    
    // Fix: Using lookahead and lookbehind logic to ensure the pattern is properly contained
    // This matches words where:
    // 1. The pattern is preceded by at least one character
    // 2. The pattern is followed by at least one character
    return `^.+${innerPattern}.+$`;
  } else if (cleanPattern.startsWith('-')) {
    // -CON → .*CON$
    // Words ending with the specified letters
    const endPattern = cleanPattern.slice(1);
    return endPattern ? `.*${endPattern}$` : pattern;
  } else if (cleanPattern.endsWith('-')) {
    // CON- → ^CON.*
    // When pattern starts with specified letters
    const startPattern = cleanPattern.slice(0, -1);
    return startPattern ? `^${startPattern}.*` : pattern;
  }

  return pattern;
};
