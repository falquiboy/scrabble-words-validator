export const convertPatternToRegex = (pattern: string): RegExp => {
  console.log('Converting pattern to regex:', pattern);
  
  let regexStr = pattern
    .replace(/\?/g, '.')  // Convert ? to . (any single character)
    .replace(/\^/g, '^')  // Keep start anchor
    .replace(/\$/g, '$'); // Keep end anchor
  
  // If pattern doesn't start with ^, allow any characters at start
  if (!pattern.startsWith('^')) {
    regexStr = '.*' + regexStr;
  }
  
  // If pattern doesn't end with $, allow any characters at end
  if (!pattern.endsWith('$')) {
    regexStr = regexStr + '.*';
  }
  
  console.log('Generated regex string:', regexStr);
  return new RegExp(`^${regexStr}$`, 'i');
};