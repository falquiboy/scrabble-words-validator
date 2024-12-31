export const convertPatternToRegex = (pattern: string): RegExp => {
  if (!pattern) return /.*/;

  // Split by hyphens but preserve question marks
  const parts = pattern.split('-').filter(Boolean);
  if (parts.length === 0) return /.*/;

  let regexPattern = '';
  
  // Add wildcard at start if pattern starts with hyphen
  if (pattern.startsWith('-')) {
    regexPattern += '.*';
  }
  
  // Convert parts to regex, preserving question marks
  regexPattern += parts
    .map(part => part.replace(/\?/g, '.'))
    .join('.*');
  
  // Add wildcard at end if pattern ends with hyphen
  if (pattern.endsWith('-')) {
    regexPattern += '.*';
  }

  return new RegExp(`^${regexPattern}$`);
};