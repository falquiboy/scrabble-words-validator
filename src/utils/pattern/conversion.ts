
/**
 * Replaces special symbols with their character classes
 * @ = any vowel (A, E, I, O, U)
 * & = any consonant (all letters except vowels)
 */
const expandSpecialSymbols = (pattern: string): string => {
  // Replace @ with vowel character class
  let expanded = pattern.replace(/@/g, '[AEIOU]');
  
  // Replace & with consonant character class (including Ñ, Ç, K, W for digraphs)
  expanded = expanded.replace(/&/g, '[BCDFGHJKLMNÑPQRSTVWXYZÇKW]');
  
  return expanded;
};

/**
 * Converts a pattern into a RegExp object
 * Handles special pattern formats
 */
export const convertPatternToRegex = (pattern: string): RegExp => {
  // First expand special symbols (@ for vowels, & for consonants)
  const expandedPattern = expandSpecialSymbols(pattern);
  // Check if the pattern is already a regex-formatted pattern
  // (has explicit anchors or .* patterns from translateHyphenPattern)
  const isProcessedPattern = expandedPattern.includes('.*') || 
                             expandedPattern.startsWith('^') ||
                             expandedPattern.endsWith('$');
  
  // If already translated, don't modify further
  if (isProcessedPattern) {
    // Ensure the pattern has proper anchors for exact matching
    let finalPattern = expandedPattern;
    
    // Make sure we have a proper start anchor if needed
    if (!finalPattern.startsWith('^')) {
      finalPattern = '^' + finalPattern;
    }
    
    // Make sure we have a proper end anchor if needed
    if (!finalPattern.endsWith('$')) {
      finalPattern = finalPattern + '$';
    }
    
    return new RegExp(finalPattern, 'i');
  }
  
  // For simple patterns, add ^ and $ to match the entire word
  return new RegExp(`^${expandedPattern}$`, 'i');
};
