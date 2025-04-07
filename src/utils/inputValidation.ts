import { processDigraphs } from "./digraphs";

export const MAX_RACK_LETTERS = 7; // Updated to 7 as per requirements
export const MAX_PATTERN_LENGTH = 10;
export const MAX_WILDCARDS = 2; // Max number of wildcards in rack

export const validateAndCleanAnagramInput = (value: string) => {
  // Split into parts if there's a length constraint
  const parts = value.split(':');
  
  if (parts.length > 2) {
    // Keep only the first colon
    const [letters, lengthStr, ...rest] = parts;
    return letters + ':' + lengthStr;
  }
  
  if (parts.length === 2) {
    const [letters, lengthStr] = parts;
    // Clean letters part (allow A-Z, Ñ, Ç, *, and commas)
    const cleanLetters = letters.replace(/[^A-ZÑÇKW*,]/g, '');
    
    // Only allow numbers after the colon
    const cleanLength = lengthStr.replace(/[^0-9]/g, '');
    
    // Return the cleaned format with colon
    return cleanLetters + ':' + cleanLength;
  }
  
  // If no colon, just clean input (allow A-Z, Ñ, Ç, *, commas and colon)
  return value.replace(/[^A-ZÑÇKW*,\:]/g, '');
};

export const validateAndCleanPatternInput = (value: string) => {
  // Split into pattern and rack parts if comma exists
  const parts = value.split(',');
  
  // Handle pattern with rack and possibly length
  if (parts.length > 1) {
    // Split into pattern/length and rack parts
    let [patternPart, rackPart] = parts;
    
    // Enforce maximum of 7 letters for rack, including wildcards
    const cleanRack = rackPart.replace(/[^A-ZÑÇKW*]/g, '').slice(0, MAX_RACK_LETTERS);
    
    // Enforce maximum of 2 wildcards in rack
    const wildcardCount = (cleanRack.match(/\*/g) || []).length;
    let finalRack = cleanRack;
    if (wildcardCount > MAX_WILDCARDS) {
      // Remove excess wildcards
      const excessWildcards = wildcardCount - MAX_WILDCARDS;
      finalRack = cleanRack.replace(/\*/g, (match, index) => {
        return index >= wildcardCount - excessWildcards ? '' : match;
      });
    }
    
    // Check if pattern part contains a length constraint
    const patternParts = patternPart.split(':');
    if (patternParts.length > 1) {
      const [pattern, lengthStr] = patternParts;
      
      // Clean pattern (allow A-Z, Ñ, Ç, ?, -)
      // Disallow hyphens in the middle of the pattern
      const cleanPattern = cleanHyphenPattern(pattern);
      
      // Only allow numbers for length
      const cleanLength = lengthStr.replace(/[^0-9]/g, '');
      
      return `${cleanPattern}:${cleanLength},${finalRack}`;
    }
    
    // If no length constraint in pattern
    const cleanPattern = cleanHyphenPattern(patternPart);
    
    return `${cleanPattern},${finalRack}`;
  }
  
  // Handle pattern with length but no rack
  const patternParts = value.split(':');
  if (patternParts.length > 1) {
    const [pattern, lengthStr, ...rest] = patternParts;
    
    // Clean pattern (allow A-Z, Ñ, Ç, ?, -)
    const cleanPattern = cleanHyphenPattern(pattern);
    
    // Only allow numbers for length
    const cleanLength = lengthStr.replace(/[^0-9]/g, '');
    
    return `${cleanPattern}:${cleanLength}`;
  }
  
  // For the simple pattern case, check if the value ends with a colon
  if (value.endsWith(':')) {
    const patternPart = value.slice(0, -1);
    const cleanPattern = cleanHyphenPattern(patternPart);
    return `${cleanPattern}:`;
  }
  
  // If value contains a colon followed by numbers
  const colonWithNumbersMatch = value.match(/^([A-ZÑÇKW?\^$\-]*):(\d*)$/);
  if (colonWithNumbersMatch) {
    const [_, patternPart, lengthPart] = colonWithNumbersMatch;
    const cleanPattern = cleanHyphenPattern(patternPart);
    return `${cleanPattern}:${lengthPart}`;
  }
  
  // If no colon, only allow pattern characters
  return cleanHyphenPattern(value);
};

/**
 * Helper function to clean hyphen patterns and enforce rules:
 * - Hyphens can only be at the start or end, not in the middle
 * - Multiple hyphens at start/end are reduced to one
 */
function cleanHyphenPattern(pattern: string): string {
  // Remove invalid characters
  let cleaned = pattern.replace(/[^A-ZÑÇKW?\-]/g, '');
  
  // Handle hyphens - only allow at start and/or end
  // If there's a hyphen in the middle, remove it
  if (cleaned.length > 2) {
    if (cleaned.startsWith('-') && cleaned.endsWith('-')) {
      // For patterns like "-ABC-", keep both hyphens
      const inner = cleaned.slice(1, -1);
      // Remove any hyphens inside
      const cleanInner = inner.replace(/-/g, '');
      cleaned = `-${cleanInner}-`;
    } else if (cleaned.startsWith('-')) {
      // For patterns like "-ABC", keep only the starting hyphen
      const rest = cleaned.slice(1);
      // Remove any hyphens inside
      const cleanRest = rest.replace(/-/g, '');
      cleaned = `-${cleanRest}`;
    } else if (cleaned.endsWith('-')) {
      // For patterns like "ABC-", keep only the ending hyphen
      const rest = cleaned.slice(0, -1);
      // Remove any hyphens inside
      const cleanRest = rest.replace(/-/g, '');
      cleaned = `${cleanRest}-`;
    } else {
      // For patterns without hyphens at start/end, remove all hyphens
      cleaned = cleaned.replace(/-/g, '');
    }
  }
  
  return cleaned;
}
