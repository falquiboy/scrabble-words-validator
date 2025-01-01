export const convertPatternToRegex = (pattern: string): RegExp => {
  // Replace ? with . for single character matching
  let regexPattern = pattern.replace(/\?/g, '.');
  
  // If no anchors are present, allow pattern to match anywhere in word
  if (!pattern.includes('^') && !pattern.includes('$')) {
    regexPattern = `.*${regexPattern}.*`;
  }

  // Create regex with case insensitivity
  return new RegExp(`^${regexPattern}$`, 'i');
};