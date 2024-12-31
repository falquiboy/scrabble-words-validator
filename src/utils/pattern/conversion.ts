/**
 * Converts a pattern like "??V-" into a proper regex pattern
 * that enforces position constraints
 */
export const convertPatternToRegex = (pattern: string): RegExp => {
  // Handle empty pattern
  if (!pattern) return /.*/;

  // Split by hyphen to handle prefix/suffix patterns
  const parts = pattern.split('-');
  
  if (parts.length === 1) {
    // No hyphens, direct conversion
    return new RegExp(`^${pattern.replace(/\?/g, '.')}$`);
  }

  // Filter out empty strings from parts array
  const nonEmptyParts = parts.filter(part => part.length > 0);

  if (nonEmptyParts.length === 0) {
    // Pattern is just hyphens, match anything
    return /.*/;
  }

  // For patterns with hyphens, we need to handle start/end patterns differently
  let regexPattern = '';
  
  // If pattern starts with hyphen, allow any characters at start
  if (pattern.startsWith('-')) {
    regexPattern += '.*';
  }

  // Add the fixed parts with proper wildcards
  regexPattern += nonEmptyParts.map(part => 
    part.replace(/\?/g, '.')
  ).join('.*');

  // If pattern ends with hyphen, allow any characters at end
  if (pattern.endsWith('-')) {
    regexPattern += '.*';
  }

  return new RegExp(`^${regexPattern}$`);
};