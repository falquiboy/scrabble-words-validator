
// Orden personalizado del alfabeto español incluyendo dígrafos
const SPANISH_ALPHABET = "AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ";

// Caché de posiciones de letras para optimizar rendimiento
const LETTER_POSITIONS = new Map(
  [...SPANISH_ALPHABET].map((letter, index) => [letter, index])
);

/**
 * Ordena un string según el orden del alfabeto español
 * Versión optimizada con caché de posiciones
 */
export const sortSpanishLetters = (input: string | string[]): string => {
  const upperInput = typeof input === 'string' ? input.toUpperCase() : 
                    Array.isArray(input) ? input.join('').toUpperCase() : '';
                    
  return [...upperInput]
    .sort((a, b) => {
      const posA = LETTER_POSITIONS.get(a) ?? Number.MAX_SAFE_INTEGER;
      const posB = LETTER_POSITIONS.get(b) ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    })
    .join('');
};
