// Spanish digraphs and their internal representations
const DIGRAPHS = {
  CH: 'Ç',
  LL: 'K',
  RR: 'W'
} as const;

/**
 * Processes digraphs in a word, converting them to internal representation
 * This handles the complete normalization process including case conversion and accents
 */
export const processDigraphs = (input: string): string => {
  if (!input) return '';
  
  // First convert to uppercase
  let result = input.toUpperCase();
  
  // Special handling for Ñ to preserve it through normalization
  result = result.replace(/Ñ/g, '#');
  
  // Remove accents
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
  
  // Restore Ñ
  result = result.replace(/#/g, 'Ñ');
  
  // Process digraphs in a specific order
  // First, handle CH to avoid conflicts
  result = result.replace(/CH/g, 'Ç');
  // Then handle the rest
  result = result.replace(/LL/g, 'K');
  result = result.replace(/RR/g, 'W');
  
  return result;
};

/**
 * Converts internal representation back to display format
 */
export const toDisplayFormat = (word: string): string => {
  if (!word) return '';
  
  let result = word;
  
  // Convert back in reverse order to avoid conflicts
  result = result.replace(/W/g, 'RR');
  result = result.replace(/K/g, 'LL');
  result = result.replace(/Ç/g, 'CH');
  
  return result;
};

/**
 * Calculate digraph-sensitive length
 * Each digraph (CH, LL, RR) counts as one letter
 */
export const getInternalLength = (word: string): number => {
  // Use processDigraphs to ensure consistent handling
  const processed = processDigraphs(word);
  
  // Now the length will be correct as each digraph is represented by one character
  return processed.length;
};

// Custom alphabet order for sorting
const CUSTOM_ALPHABET = "AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ";