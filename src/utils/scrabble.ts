// Spanish Scrabble letter values
const letterValues: { [key: string]: number } = {
  'A': 1, 'E': 1, 'O': 1, 'I': 1, 'S': 1, 'N': 1, 'L': 1, 'R': 1, 'U': 1, 'T': 1,
  'D': 2, 'G': 2,
  'C': 3, 'B': 3, 'M': 3, 'P': 3,
  'H': 4, 'F': 4, 'V': 4, 'Y': 4,
  'Q': 5,
  'J': 8, 'Ñ': 8,
  'X': 10,
  'Z': 10
};

// This is a placeholder - you'll need to replace this with your actual word list
const validWords = new Set(['CASA', 'PERRO', 'GATO']);

export const isValidWord = (word: string): boolean => {
  return validWords.has(word.toUpperCase());
};

export const calculateWordScore = (word: string): number => {
  return word
    .toUpperCase()
    .split('')
    .reduce((score, letter) => score + (letterValues[letter] || 0), 0);
};