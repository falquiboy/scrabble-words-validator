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
  // Allow slash in the input by not removing it in the regex
  // Now allowing Ç explicitly in the regex
  return value.replace(/[^A-ZÑÇKW*,/0-9]/g, '');
};

export const validateAndCleanPatternInput = (value: string) => {
  // Split into pattern and rack parts if comma exists
  const parts = value.split(',');
  
  if (parts.length > 1) {
    // Keep only the first two parts if multiple commas
    let [patternPart, rackPart] = parts;
    
    // Handle pattern part - allow ?, ^, $, -, and letters (including Ç)
    // Allow hyphens at any position in the pattern
    patternPart = patternPart.replace(/[^A-ZÑÇKW?\^$\-]/g, '');
    
    // Handle rack part - allow letters and asterisk (*) (including Ç)
    rackPart = rackPart.replace(/[^A-ZÑÇKW*]/g, '');
    
    return `${patternPart},${rackPart}`;
  }
  
  // If no comma, treat as pattern part
  // Allow hyphens at any position in the pattern
  return value.replace(/[^A-ZÑÇKW?\^$\-]/g, '');
};