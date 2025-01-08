export const convertPatternToRegex = (pattern: string): RegExp => {
  // First translate any hyphen-based patterns
  const translatedPattern = translateHyphenPattern(pattern)
    .replace(/\?/g, '.')  // Convert ? to . (any single character)
    .replace(/\^/g, '^')  // Keep start anchor
    .replace(/\$/g, '$'); // Keep end anchor
  
  // Only add .* at start/end if there are no explicit anchors
  let regexStr = translatedPattern;
  if (!translatedPattern.startsWith('^') && !translatedPattern.startsWith('.*')) {
    regexStr = '.*' + regexStr;
  }
  if (!translatedPattern.endsWith('$') && !translatedPattern.endsWith('.*')) {
    regexStr = regexStr + '.*';
  }
  
  return new RegExp(`^${regexStr}$`, 'i');
};