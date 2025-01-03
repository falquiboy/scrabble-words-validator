export const convertPatternToRegex = (pattern: string): RegExp => {
  // Replace ? with . for single character matching
  let regexPattern = pattern.replace(/\?/g, '.');
  
  // Remove dashes as they're handled separately in validation
  regexPattern = regexPattern.replace(/-/g, '');
  
  // Create regex with case insensitivity
  return new RegExp(`${regexPattern}`, 'i');
};