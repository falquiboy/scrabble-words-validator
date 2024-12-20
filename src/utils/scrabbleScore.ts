// Spanish Scrabble tile values
const LETTER_VALUES: { [key: string]: number } = {
  'A': 1, 'E': 1, 'O': 1, 'I': 1, 'S': 1, 'N': 1, 'R': 1, 'U': 1, 'L': 1, 'T': 1,
  'D': 2, 'G': 2,
  'C': 3, 'B': 3, 'M': 3, 'P': 3,
  'H': 4, 'F': 4, 'V': 4, 'Y': 4,
  'CH': 5, 'Q': 5,
  'J': 8, 'LL': 8, 'Ñ': 8, 'RR': 8, 'X': 8,
  'Z': 10
};

export const calculateWordScore = (word: string): number => {
  let score = 0;
  let i = 0;
  
  while (i < word.length) {
    // Check for digraphs first
    const twoChars = word.substring(i, i + 2).toUpperCase();
    if ((twoChars === 'CH' || twoChars === 'LL' || twoChars === 'RR') && LETTER_VALUES[twoChars]) {
      score += LETTER_VALUES[twoChars];
      i += 2;
    } else {
      // Single character
      const char = word[i].toUpperCase();
      score += LETTER_VALUES[char] || 0;
      i++;
    }
  }
  
  return score;
};