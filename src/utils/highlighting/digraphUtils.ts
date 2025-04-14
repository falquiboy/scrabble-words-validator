
/**
 * Utility functions for handling digraphs in word highlighting
 */

/**
 * Finds positions of digraphs in a word
 */
export const findDigraphPositions = (word: string): { start: number, end: number }[] => {
  const positions: { start: number, end: number }[] = [];
  const chars = word.split('');
  
  for (let i = 0; i < chars.length - 1; i++) {
    if (
      (chars[i] === 'C' && chars[i + 1] === 'H') ||
      (chars[i] === 'L' && chars[i + 1] === 'L') ||
      (chars[i] === 'R' && chars[i + 1] === 'R')
    ) {
      positions.push({ start: i, end: i + 1 });
      i++; // Skip next character as it's part of the digraph
    }
  }
  
  return positions;
};
