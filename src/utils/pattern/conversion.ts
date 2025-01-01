export const convertPatternToRegex = (pattern: string): RegExp => {
  // Replace ? with . for single character matching
  let regexPattern = pattern.replace(/\?/g, '.');
  
  // Handle anchors - don't add .* if anchors are present
  if (!pattern.includes('^') && !pattern.includes('$')) {
    regexPattern = `.*${regexPattern}.*`;
  } else {
    // Remove existing anchors to prevent doubles
    regexPattern = regexPattern.replace(/^\^/, '').replace(/\$$/, '');
    // Add them back properly
    if (pattern.startsWith('^')) regexPattern = '^' + regexPattern;
    if (pattern.endsWith('$')) regexPattern = regexPattern + '$';
  }

  // Create regex with case insensitivity
  return new RegExp(`${regexPattern}`, 'i');
};