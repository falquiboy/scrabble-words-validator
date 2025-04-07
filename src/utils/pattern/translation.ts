/**
 * Translates hyphen-based patterns into regex-compatible patterns
 * -CON → .*CON$ (ends with CON)
 * CON- → ^CON.* (starts with CON)
 * -CON- → .*CON.* (contains CON)
 * -Z?C- → .*Z.C.* (contains Z followed by any character, then C)
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
    
    // Convert any question marks to .
    const questionMarksConverted = innerPattern.replace(/\?/g, '.');
    
    // For "contains" patterns, we use a simpler regex
    return `.*${questionMarksConverted}.*`;
  } else if (cleanPattern.startsWith('-')) {
    // -CON → .*CON$
    // Words ending with the specified letters
    const endPattern = cleanPattern.slice(1);
    if (!endPattern) return pattern;
    
    // Convert any question marks to .
    const questionMarksConverted = endPattern.replace(/\?/g, '.');
    
    return `.*${questionMarksConverted}$`;
  } else if (cleanPattern.endsWith('-')) {
    // CON- → ^CON.*
    // When pattern starts with specified letters
    const startPattern = cleanPattern.slice(0, -1);
    if (!startPattern) return pattern;
    
    // Convert any question marks to .
    const questionMarksConverted = startPattern.replace(/\?/g, '.');
    
    return `^${questionMarksConverted}.*`;
  }

  // If no hyphens, keep the pattern as-is (handling question marks happens elsewhere)
  return pattern;
};
