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

// Initialize with a basic set of common Spanish words
// This is just a small sample - you should replace this with your full word list
const validWords: Set<string> = new Set([
  "CASA", "PERRO", "GATO", "MESA", "SILLA", "LIBRO", "PAPEL", "LAPIZ",
  "COMER", "BEBER", "DORMIR", "CANTAR", "BAILAR", "JUGAR", "CORRER",
  "AMOR", "VIDA", "TIEMPO", "MUNDO", "CIELO", "TIERRA", "AGUA", "FUEGO",
  "SOL", "LUNA", "ESTRELLA", "FLOR", "ARBOL", "PIEDRA", "MONTE",
  // ... Add your complete word list here
]);

export const isValidWord = (word: string): boolean => {
  return validWords.has(word.toUpperCase());
};

export const calculateWordScore = (word: string): number => {
  return word
    .toUpperCase()
    .split('')
    .reduce((score, letter) => score + (letterValues[letter] || 0), 0);
};