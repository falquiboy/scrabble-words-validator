import { translateHyphenPattern } from './translation';

export const convertPatternToRegex = (pattern: string): RegExp => {
  // First translate any hyphen-based patterns
  const translatedPattern = translateHyphenPattern(pattern)
    .replace(/\?/g, '.')  // Convert ? to . (any single character)
    .replace(/\^/g, '^')  // Keep start anchor
    .replace(/\$/g, '$'); // Keep end anchor
  
  // Only add .* at start/end if there are no explicit anchors
  let regexStr = translatedPattern;
  if (!regexStr.startsWith('^')) {
    regexStr = '.*' + regexStr;
  }
  if (!regexStr.endsWith('$') && !regexStr.endsWith('.*')) {
    regexStr = regexStr + '.*';
  }
  
  return new RegExp(`^${regexStr}$`, 'i');
};