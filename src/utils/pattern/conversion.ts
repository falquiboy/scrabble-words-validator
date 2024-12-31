export const convertPatternToRegex = (pattern: string): RegExp => {
  if (!pattern) return /.*/;

  // Split by hyphen and filter out empty parts
  const parts = pattern.split('-').filter(Boolean);
  
  if (parts.length === 0) return /.*/;
  
  // Build regex pattern
  let regexPattern = '';
  
  // Add wildcard at start if pattern starts with hyphen
  if (pattern.startsWith('-')) regexPattern += '.*';
  
  // Add parts with proper wildcards
  regexPattern += parts.map(part => part.replace(/\?/g, '.')).join('.*');
  
  // Add wildcard at end if pattern ends with hyphen
  if (pattern.endsWith('-')) regexPattern += '.*';
  
  return new RegExp(`^${regexPattern}$`);
};