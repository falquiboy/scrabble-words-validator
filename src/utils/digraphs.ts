// Special characters used to represent digraphs internally
const DIGRAPH_CH = 'Ç';
const DIGRAPH_LL = 'K';
const DIGRAPH_RR = 'W';

export const processDigraphs = (input: string): string => {
  let result = input.toUpperCase();
  
  // Process only complete digraphs
  result = result.replace(/CH/g, DIGRAPH_CH);
  result = result.replace(/LL/g, DIGRAPH_LL);
  result = result.replace(/RR/g, DIGRAPH_RR);
  
  // Validate that remaining letters can't form invalid digraphs
  if (
    result.includes('C') && result.includes('H') || // Can't form CH
    (result.match(/L/g) || []).length >= 2 ||       // Can't form LL
    (result.match(/R/g) || []).length >= 2          // Can't form RR
  ) {
    return ''; // Return empty string to indicate invalid word
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

// Export constants for use in other files
export const DIGRAPHS = {
  CH: DIGRAPH_CH,
  LL: DIGRAPH_LL,
  RR: DIGRAPH_RR
};