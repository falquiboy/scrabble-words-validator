export const processDigraphs = (input: string): string => {
  // First ensure we're working with uppercase
  let result = input.toUpperCase();
  
  // Process digraphs in a specific order to avoid conflicts
  result = result
    .replace(/CH/g, 'Ç')
    .replace(/LL/g, 'K')
    .replace(/RR/g, 'W');
    
  return result;
};

export const generateAlphagram = (input: string): string => {
  return [...input].sort((a, b) => {
    const posA = CUSTOM_ALPHABET.indexOf(a);
    const posB = CUSTOM_ALPHABET.indexOf(b);
    return posA - posB;
  }).join('');
};

export const toDisplayFormat = (word: string): string => {
  return word
    .replace(/Ç/g, 'CH')
    .replace(/K/g, 'LL')
    .replace(/W/g, 'RR');
};

// Calculate digraph-sensitive length
export const getInternalLength = (word: string): number => {
  // Count digraphs as single letters
  const digraphCount = (word.match(/CH|LL|RR/g) || []).length;
  // Subtract from total length because each digraph counts as one letter instead of two
  return word.length - digraphCount;
};

// Custom alphabet order for sorting
const CUSTOM_ALPHABET = "AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ";