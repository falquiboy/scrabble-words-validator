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
  
  // Check for adjacent letters that could form invalid digraphs
  const chars = result.split('');
  for (let i = 0; i < chars.length - 1; i++) {
    // Check for potential CH
    if (chars[i] === 'C' && chars[i + 1] === 'H') {
      return ''; // Invalid: adjacent C and H would form CH
    }
    // Check for potential LL
    if (chars[i] === 'L' && chars[i + 1] === 'L') {
      return ''; // Invalid: adjacent Ls would form LL
    }
    // Check for potential RR
    if (chars[i] === 'R' && chars[i + 1] === 'R') {
      return ''; // Invalid: adjacent Rs would form RR
    }
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