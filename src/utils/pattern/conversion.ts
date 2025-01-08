import { translateHyphenPattern } from './translation';

export const convertPatternToRegex = (pattern: string): RegExp => {
  // First translate any hyphen-based patterns
  const translatedPattern = translateHyphenPattern(pattern)
    .replace(/\?/g, '.')  // Convert ? to . (any single character)
    .replace(/\^/g, '^')  // Keep start anchor
    .replace(/\$/g, '$'); // Keep end anchor
  
  // Only add .* at start/end if there are no explicit anchors
  let regexStr = translatedPattern;
  
  // Don't add .* at the start if we have a ^ anchor
  if (!regexStr.startsWith('^')) {
    regexStr = '.*' + regexStr;
  }
  
  // Don't add .* at the end if we have a $ anchor or already ends with .*
  if (!regexStr.endsWith('$') && !regexStr.endsWith('.*')) {
    regexStr = regexStr + '.*';
  }
  
  return new RegExp(`^${regexStr}$`, 'i');
};