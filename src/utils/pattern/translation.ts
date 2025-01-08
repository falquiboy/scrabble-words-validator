/**
 * Translates hyphen-based patterns into regex-compatible patterns
 * -CON → CON$ (ends with)
 * CON- → ^CON (starts with)
 * -CON- → .*CON.* (contains)
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
    // -CON- → .*CON.*
    const innerPattern = cleanPattern.slice(1, -1);
    return innerPattern ? `.*${innerPattern}.*` : pattern;
  } else if (cleanPattern.startsWith('-')) {
    // -CON → CON$
    const endPattern = cleanPattern.slice(1);
    return endPattern ? `${endPattern}$` : pattern;
  } else if (cleanPattern.endsWith('-')) {
    // CON- → ^CON
    const startPattern = cleanPattern.slice(0, -1);
    // Ensure we add the ^ anchor and don't allow any characters before
    return startPattern ? `^${startPattern}` : pattern;
  }

  return pattern;
};