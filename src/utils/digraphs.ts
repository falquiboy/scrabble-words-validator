// Cache for processed words to avoid repeated processing
const processedWordsCache = new Map<string, string>();

export const processDigraphs = (input: string): string => {
  // Check cache first
  const cached = processedWordsCache.get(input);
  if (cached) return cached;

  let result = input.toUpperCase();
  // Process all instances of each digraph with global flag
  result = result
    .replace(/CH/g, 'Ç')
    .replace(/LL/g, 'K')
    .replace(/RR/g, 'W');
  
  // Store in cache
  processedWordsCache.set(input, result);
  return result;
};

// Custom alphabet order for sorting
const CUSTOM_ALPHABET = "AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ";

// Generate alphagram using custom alphabet order
export const generateAlphagram = (input: string): string => {
  // Check if input is empty or undefined
  if (!input) return '';
  
  return [...input].sort((a, b) => {
    const posA = CUSTOM_ALPHABET.indexOf(a);
    const posB = CUSTOM_ALPHABET.indexOf(b);
    return posA - posB;
  }).join('');
};

// Convert internal format back to display format
export const toDisplayFormat = (word: string): string => {
  // Check if word is empty or undefined
  if (!word) return '';
  
  return word
    .replace(/Ç/g, 'CH')
    .replace(/K/g, 'LL')
    .replace(/W/g, 'RR');
};

// Calculate digraph-sensitive length
export const getInternalLength = (word: string): number => {
  // Check if word is empty or undefined
  if (!word) return 0;
  
  // Count digraphs as single letters
  const digraphCount = (word.match(/CH|LL|RR/g) || []).length;
  // Subtract from total length because each digraph counts as one letter instead of two
  return word.length - digraphCount;
};