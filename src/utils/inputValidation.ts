import { toast } from "@/components/ui/use-toast";
import { processDigraphs } from "./digraphs";

export const MAX_RACK_LETTERS = 7;
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
    
    // Clean letters part (allow A-Z, Ñ, *, and commas)
    const cleanLetters = letters.replace(/[^A-ZÑ*,]/g, '');
    
    // Process digraphs and check letter limit only for the actual letters part
    const actualLetters = cleanLetters.replace(/[^A-ZÑ]/g, '');
    const processedLetters = processDigraphs(actualLetters);
    
    if (processedLetters.length > MAX_RACK_LETTERS) {
      toast({
        title: "Límite excedido",
        description: `No puedes usar más de ${MAX_RACK_LETTERS} letras en el atril después de procesar dígrafos.`,
        variant: "destructive",
      });
      // Return the input truncated to maintain valid length after digraph processing
      const truncatedLetters = actualLetters.slice(0, MAX_RACK_LETTERS);
      return truncatedLetters + '/' + cleanLength;
    }
    
    return cleanLetters + '/' + cleanLength;
  }
  
  // If no slash, just clean and check letter limit
  // Allow slash in the input by not removing it in the regex
  const cleanLetters = value.replace(/[^A-ZÑ*,/0-9]/g, '');
  const actualLetters = cleanLetters.replace(/[^A-ZÑ]/g, '');
  const processedLetters = processDigraphs(actualLetters);
  
  if (processedLetters.length > MAX_RACK_LETTERS) {
    toast({
      title: "Límite excedido",
      description: `No puedes usar más de ${MAX_RACK_LETTERS} letras en el atril después de procesar dígrafos.`,
      variant: "destructive",
    });
    // Return the input truncated to maintain valid length after digraph processing
    return actualLetters.slice(0, MAX_RACK_LETTERS);
  }
  
  return cleanLetters;
};

export const validateAndCleanPatternInput = (value: string) => {
  // Split into pattern and rack parts if comma exists
  const parts = value.split(',');
  
  if (parts.length > 1) {
    // Keep only the first two parts if multiple commas
    let [patternPart, rackPart] = parts;
    
    // Handle pattern part - allow ?, -, and letters
    patternPart = patternPart.replace(/[^A-ZÑ?\-,]/g, '');
    
    // Limit pattern length
    if (patternPart.length > MAX_PATTERN_LENGTH) {
      toast({
        title: "Límite excedido",
        description: `El patrón no puede tener más de ${MAX_PATTERN_LENGTH} posiciones.`,
        variant: "destructive",
      });
      patternPart = patternPart.slice(0, MAX_PATTERN_LENGTH);
    }
    
    // Handle rack part - only letters, and check length after digraph processing
    rackPart = rackPart.replace(/[^A-ZÑ]/g, '');
    const processedRack = processDigraphs(rackPart);
    
    // Limit rack letters
    if (processedRack.length > MAX_RACK_LETTERS) {
      toast({
        title: "Límite excedido",
        description: `No puedes usar más de ${MAX_RACK_LETTERS} letras en el atril después de procesar dígrafos.`,
        variant: "destructive",
      });
      rackPart = rackPart.slice(0, MAX_RACK_LETTERS);
    }
    
    return `${patternPart},${rackPart}`;
  }
  
  // If no comma, treat as pattern part
  let patternPart = value.replace(/[^A-ZÑ?\-,]/g, '');
  
  // Limit pattern length
  if (patternPart.length > MAX_PATTERN_LENGTH) {
    toast({
      title: "Límite excedido",
      description: `El patrón no puede tener más de ${MAX_PATTERN_LENGTH} posiciones.`,
      variant: "destructive",
    });
    patternPart = patternPart.slice(0, MAX_PATTERN_LENGTH);
  }
  
  return patternPart;
};