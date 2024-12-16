// Spanish alphabet including digraphs in specified order
export const SPANISH_LETTERS = [
  "A", "B", "C", "Ç", "D", "E", "F", "G", "H", "I", "J", "L", "K", "M",
  "N", "Ñ", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

// Process only first instance of each digraph
export const processDigraphs = (input: string): string => {
  let result = input.toUpperCase();
  
  // Process only first instance of each digraph
  result = result.replace(/CH/, 'Ç');  // First CH -> Ç
  result = result.replace(/LL/, 'K');  // First LL -> K
  result = result.replace(/RR/, 'W');  // First RR -> W
  
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

// Get the internal length of a word (after processing digraphs)
export const getInternalLength = (word: string): number => {
  return processDigraphs(word).length;
};