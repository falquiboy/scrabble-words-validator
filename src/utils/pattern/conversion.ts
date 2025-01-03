export const convertPatternToRegex = (pattern: string): RegExp => {
  // Remove dashes as they're handled in validation
  const cleanPattern = pattern.replace(/-/g, '');
  
  // Convert the pattern to a regex string
  const regexStr = cleanPattern
    .replace(/\?/g, '.')  // ? matches any single character
    .replace(/\^/g, '^')  // ^ for start of word
    .replace(/\$/g, '$'); // $ for end of word
  
  return new RegExp(regexStr);
};