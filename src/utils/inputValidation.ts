
import { toast } from "@/components/ui/use-toast";
import { processDigraphs } from "./digraphs";

// Removing the 7-letter constraint
export const MAX_RACK_LETTERS = 15; // Increased to a more reasonable limit
export const MAX_PATTERN_LENGTH = 10;

export const validateAndCleanAnagramInput = (value: string) => {
  // Split into parts if there's a length constraint
  const parts = value.split('/');
  
  if (parts.length > 2) {
    // Keep only the first slash
    const [letters, lengthStr, ...rest] = parts;
    return letters + '/' + lengthStr;
  }
  
  if (parts.length === 2) {
    const [letters, lengthStr] = parts;
    // Clean letters part (allow A-Z, Ñ, Ç, *, and commas)
    const cleanLetters = letters.replace(/[^A-ZÑÇKW*,]/g, '');
    
    // Only allow numbers after the slash
    const cleanLength = lengthStr.replace(/[^0-9]/g, '');
    
    // Return the cleaned format with slash
    return cleanLetters + '/' + cleanLength;
  }
  
  // If no slash, just clean input (allow A-Z, Ñ, Ç, *, commas and slash)
  return value.replace(/[^A-ZÑÇKW*,\/]/g, '');
};

export const validateAndCleanPatternInput = (value: string) => {
  // Split into pattern and rack parts if comma exists
  const parts = value.split(',');
  
  // Handle pattern with rack and possibly length
  if (parts.length > 1) {
    // Split into pattern/length and rack parts
    let [patternPart, rackPart] = parts;
    
    // Check if pattern part contains a length constraint
    const patternParts = patternPart.split('/');
    if (patternParts.length > 1) {
      const [pattern, lengthStr] = patternParts;
      
      // Clean pattern (allow A-Z, Ñ, Ç, ?, ^, $, -)
      const cleanPattern = pattern.replace(/[^A-ZÑÇKW?\^$\-]/g, '');
      
      // Only allow numbers for length
      const cleanLength = lengthStr.replace(/[^0-9]/g, '');
      
      // Clean rack (allow A-Z, Ñ, Ç, *)
      const cleanRack = rackPart.replace(/[^A-ZÑÇKW*]/g, '');
      
      return `${cleanPattern}/${cleanLength},${cleanRack}`;
    }
    
    // If no length constraint in pattern
    const cleanPattern = patternPart.replace(/[^A-ZÑÇKW?\^$\-\/]/g, '');
    const cleanRack = rackPart.replace(/[^A-ZÑÇKW*]/g, '');
    
    return `${cleanPattern},${cleanRack}`;
  }
  
  // Handle pattern with length but no rack
  const patternParts = value.split('/');
  if (patternParts.length > 1) {
    const [pattern, lengthStr, ...rest] = patternParts;
    
    // Clean pattern (allow A-Z, Ñ, Ç, ?, ^, $, -)
    const cleanPattern = pattern.replace(/[^A-ZÑÇKW?\^$\-]/g, '');
    
    // Only allow numbers for length
    const cleanLength = lengthStr.replace(/[^0-9]/g, '');
    
    return `${cleanPattern}/${cleanLength}`;
  }
  
  // Simple pattern with no length or rack constraints
  // Very important: Allow forward slash in the pattern input to prepare for length specification
  return value.replace(/[^A-ZÑÇKW?\^$\-\/0-9]/g, '');
};
