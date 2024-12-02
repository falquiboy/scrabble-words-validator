export const processDigraphs = (input: string): string => {
  let result = input.toUpperCase();
  // Process all instances of each digraph using global regex
  result = result.replace(/CH/g, 'Ç');
  result = result.replace(/LL/g, 'K');
  result = result.replace(/RR/g, 'W');
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
