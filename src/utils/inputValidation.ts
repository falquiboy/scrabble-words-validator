import { toast } from "@/components/ui/use-toast";
import { processDigraphs } from "./digraphs";

export const MAX_RACK_LETTERS = 15;
export const MAX_PATTERN_LENGTH = 10;

export const validateAndCleanAnagramInput = (value: string) => {
  // Split into parts if there's a length constraint
  const parts = value.split('/');
  
  if (parts.length > 2) {
    // Keep only the first slash
    return parts[0] + '/' + parts[1];
  }
  
  if (parts.length === 2) {
    const [letters, lengthStr] = parts;
    // Only allow numbers after the slash
    const cleanLength = lengthStr.replace(/[^0-9]/g, '');
    
    // Clean letters part (allow A-Z, Ñ, Ç, *, and commas)
    const cleanLetters = letters.replace(/[^A-ZÑÇKW*,]/g, '');
    
    return cleanLetters + '/' + cleanLength;
  }
  
  // If no slash, just clean input
  return value.replace(/[^A-ZÑÇKW*,/0-9]/g, '');
};

export const validateAndCleanPatternInput = (value: string) => {
  // Split into pattern and rack parts if comma exists
  const parts = value.split(',');
  
  if (parts.length > 1) {
    let [patternPart, rackPart] = parts;
    
    // Convert hyphen patterns to ^ and $ syntax
    patternPart = convertHyphenToAnchors(patternPart);
    
    // Handle pattern part - allow ?, ^, $, -, and letters (including Ç)
    patternPart = patternPart.replace(/[^A-ZÑÇKW?\^$]/g, '');
    
    // Handle rack part - allow letters and asterisk (*) (including Ç)
    rackPart = rackPart.replace(/[^A-ZÑÇKW*]/g, '');
    
    return `${patternPart},${rackPart}`;
  }
  
  // If no comma, treat as pattern part and convert hyphens
  let pattern = convertHyphenToAnchors(value);
  return pattern.replace(/[^A-ZÑÇKW?\^$]/g, '');
};

// New helper function to convert hyphen patterns to anchor syntax
const convertHyphenToAnchors = (pattern: string): string => {
  // Handle pattern that starts with hyphen (e.g., "-CAR" -> "CAR$")
  if (pattern.startsWith('-')) {
    return pattern.slice(1) + '$';
  }
  
  // Handle pattern that ends with hyphen (e.g., "TRANS-" -> "^TRANS")
  if (pattern.endsWith('-')) {
    return '^' + pattern.slice(0, -1);
  }
  
  return pattern;
};