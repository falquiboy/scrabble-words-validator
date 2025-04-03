
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
    // -CON- → (?!^CON).*CON(?!.*$).*
    // Matches words containing the pattern, but not at start or end
    const innerPattern = cleanPattern.slice(1, -1);
    if (!innerPattern) return pattern;
    
    // This regex ensures:
    // 1. There's at least one character before the pattern
    // 2. There's at least one character after the pattern
    return `^(?!${innerPattern})(?=.*${innerPattern}.*$)(?!.*${innerPattern}$).*$`;
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
