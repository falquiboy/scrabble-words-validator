// Spanish digraphs and their internal representations
const DIGRAPHS = {
  CH: 'Ç',
  LL: 'K',
  RR: 'W'
} as const;

/**
 * Processes digraphs in a word, converting them to internal representation
 * This should be called AFTER converting to uppercase and removing accents
 */
export const processDigraphs = (input: string): string => {
  let result = input;
  
  // Process digraphs in a specific order to avoid conflicts
  Object.entries(DIGRAPHS).forEach(([digraph, replacement]) => {
    result = result.replace(new RegExp(digraph, 'g'), replacement);
  });
    
  return result;
};

/**
 * Converts internal representation back to display format
 */
export const toDisplayFormat = (word: string): string => {
  let result = word;
  
  // Convert back in reverse order to avoid conflicts
  Object.entries(DIGRAPHS).forEach(([digraph, replacement]) => {
    result = result.replace(new RegExp(replacement, 'g'), digraph);
  });
  
  return result;
};

/**
 * Generates an alphagram (sorted letters) from input
 */
export const generateAlphagram = (input: string): string => {
  return [...input].sort((a, b) => {
    const posA = CUSTOM_ALPHABET.indexOf(a);
    const posB = CUSTOM_ALPHABET.indexOf(b);
    return posA - posB;
  }).join('');
};

/**
 * Calculate digraph-sensitive length
 * Each digraph (CH, LL, RR) counts as one letter
 */
export const getInternalLength = (word: string): number => {
  // First convert digraphs to their internal representation
  const processed = Object.entries(DIGRAPHS).reduce((acc, [digraph, replacement]) => {
    return acc.replace(new RegExp(digraph, 'g'), replacement);
  }, word.toUpperCase());
  
  // Now the length will be correct as each digraph is represented by one character
  return processed.length;
};

// Custom alphabet order for sorting
const CUSTOM_ALPHABET = "AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ";