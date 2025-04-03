
import { translateHyphenPattern } from './translation';

export const convertPatternToRegex = (pattern: string): RegExp => {
  // Check if the pattern is already a regex-formatted pattern
  // (has explicit anchors or .* patterns from translateHyphenPattern)
  const isProcessedPattern = pattern.includes('.*') || 
                            pattern.startsWith('^') ||
                            pattern.endsWith('$');
  
  // If already translated, don't modify further
  if (isProcessedPattern) {
    return new RegExp(`^${pattern}$`, 'i');
  }
  
  // For simple patterns, add .* at start/end to match anywhere in the word
  return new RegExp(`^.*${pattern}.*$`, 'i');
};
