export const convertPatternToRegex = (pattern: string): RegExp => {
  // If pattern starts with a hyphen, it should match at the end
  if (pattern.startsWith('-')) {
    const endPattern = pattern.slice(1); // Remove the hyphen
    return new RegExp(`${endPattern}$`, 'i');
  }
  
  let regexStr = pattern
    .replace(/\?/g, '.')  // Convert ? to . (any single character)
    .replace(/\^/g, '^')  // Keep start anchor
    .replace(/\$/g, '$'); // Keep end anchor
  
  // If pattern doesn't start with ^, allow any characters at start
  if (!pattern.startsWith('^')) {
    regexStr = '.*' + regexStr;
  }
  
  // If pattern doesn't end with $ and doesn't start with -, allow any characters at end
  if (!pattern.endsWith('$') && !pattern.startsWith('-')) {
    regexStr = regexStr + '.*';
  }
  
  return new RegExp(`^${regexStr}$`, 'i');
};