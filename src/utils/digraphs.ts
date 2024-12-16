// Special characters used to represent digraphs internally
export const DIGRAPH_CH = 'Ç';
export const DIGRAPH_LL = 'K';
export const DIGRAPH_RR = 'W';

// Spanish alphabet including digraphs in specified order
export const SPANISH_LETTERS = [
  'A', 'B', 'C', DIGRAPH_CH, 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 
  DIGRAPH_LL, 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', DIGRAPH_RR, 'S', 'T', 
  'U', 'V', 'X', 'Y', 'Z'
];

// Process only first instance of each digraph
export const processDigraphs = (input: string): string => {
  let result = input.toUpperCase();
  
  // Process only first instance of each digraph
  const firstCH = result.indexOf('CH');
  if (firstCH !== -1) {
    result = result.substring(0, firstCH) + DIGRAPH_CH + result.substring(firstCH + 2);
  }
  
  const firstLL = result.indexOf('LL');
  if (firstLL !== -1) {
    result = result.substring(0, firstLL) + DIGRAPH_LL + result.substring(firstLL + 2);
  }
  
  const firstRR = result.indexOf('RR');
  if (firstRR !== -1) {
    result = result.substring(0, firstRR) + DIGRAPH_RR + result.substring(firstRR + 2);
  }
  
  return result;
};

// Custom alphabet order for sorting
const CUSTOM_ALPHABET = "AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ";

// Generate alphagram using custom alphabet order
export const generateAlphagram = (input: string): string => {
  return [...input].sort((a, b) => {
    const posA = CUSTOM_ALPHABET.indexOf(a);
    const posB = CUSTOM_ALPHABET.indexOf(b);
    return posA - posB;
  }).join('');
};

// Convert internal format back to display format
export const toDisplayFormat = (word: string): string => {
  return word
    .replace(/Ç/g, 'CH')
    .replace(/K/g, 'LL')
    .replace(/W/g, 'RR');
};

// Helper function to check if input has adjacent letters that could form a digraph
export const hasAdjacentDigraphLetters = (input: string): { 
  hasRR: boolean;
  hasLL: boolean;
  hasCH: boolean;
} => {
  const chars = input.toUpperCase().split('');
  let hasRR = false;
  let hasLL = false;
  let hasCH = false;

  for (let i = 0; i < chars.length - 1; i++) {
    if (chars[i] === 'R' && chars[i + 1] === 'R') hasRR = true;
    if (chars[i] === 'L' && chars[i + 1] === 'L') hasLL = true;
    if (chars[i] === 'C' && chars[i + 1] === 'H') hasCH = true;
  }

  return { hasRR, hasLL, hasCH };
};

// Get internal length of a word (considering digraphs)
export const getInternalLength = (word: string): number => {
  return processDigraphs(word).length;
};