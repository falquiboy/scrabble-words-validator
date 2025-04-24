
/**
 * Translates hyphen-based patterns into regex-compatible patterns
 * -CON → .*CON$ (ends with CON)
 * CON- → ^CON.* (starts with CON)
 * -CON- → .*CON.* (contains CON anywhere)
 * -PUCH-R → .*PUCH.*R$ (contains PUCH and ends with R)
 */
export const translateHyphenPattern = (pattern: string): string => {
  // Clean the pattern first
  const cleanPattern = pattern.trim();
  
  // Handle empty or invalid patterns
  if (!cleanPattern || cleanPattern === '-') {
    return pattern;
  }

  // Handle special cases with multiple hyphens
  const parts = cleanPattern.split('-').filter(Boolean);
  if (parts.length > 2) {
    // If we have more than 2 parts, we're dealing with a compound pattern
    // Last part is treated as suffix if the pattern ends with -
    if (cleanPattern.endsWith('-')) {
      const suffix = parts[parts.length - 1];
      const mainPattern = parts.slice(0, -1).join('');
      return `.*${mainPattern}.*${suffix}$`;
    }
    // First part is treated as prefix if the pattern starts with -
    if (cleanPattern.startsWith('-')) {
      const prefix = parts[0];
      const mainPattern = parts.slice(1).join('');
      return `^${prefix}.*${mainPattern}.*`;
    }
    // If no start/end marker, treat all as contains
    return `.*${parts.join('')}.*`;
  }

  // Handle the three main cases
  if (cleanPattern.startsWith('-') && cleanPattern.endsWith('-')) {
    // -CON- → Match words containing the pattern anywhere
    const innerPattern = cleanPattern.slice(1, -1);
    if (!innerPattern) return pattern;
    
    return `.*${innerPattern}.*`;
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
