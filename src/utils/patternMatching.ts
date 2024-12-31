import { processDigraphs } from '@/utils/digraphs';
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';
import { Trie } from '@/utils/trie/types';

/**
 * Converts a pattern like "??V-" into a proper regex pattern
 * that enforces position constraints
 */
export const convertPatternToRegex = (pattern: string): RegExp => {
  // Handle empty pattern
  if (!pattern) return /.*/;

  // Split by hyphen to handle prefix/suffix patterns
  const parts = pattern.split('-');
  
  if (parts.length === 1) {
    // No hyphens, direct conversion
    return new RegExp(`^${pattern.replace(/\?/g, '.')}$`);
  }

  // Filter out empty strings from parts array
  const nonEmptyParts = parts.filter(part => part.length > 0);

  if (nonEmptyParts.length === 0) {
    // Pattern is just hyphens, match anything
    return /.*/;
  }

  // For patterns with hyphens, we need to handle start/end patterns differently
  let regexPattern = '';
  
  // If pattern starts with hyphen, allow any characters at start
  if (pattern.startsWith('-')) {
    regexPattern += '.*';
  }

  // Add the fixed parts with proper wildcards
  regexPattern += nonEmptyParts.map(part => 
    part.replace(/\?/g, '.')
  ).join('.*');

  // If pattern ends with hyphen, allow any characters at end
  if (pattern.endsWith('-')) {
    regexPattern += '.*';
  }

  return new RegExp(`^${regexPattern}$`);
};

/**
 * Validates if a word matches a given pattern and available rack letters
 */
export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  // First check if the word matches the position pattern
  const regex = convertPatternToRegex(pattern);
  const processedWord = processDigraphs(word);
  const processedPattern = processDigraphs(pattern);
  
  if (!regex.test(processedWord)) return false;

  // If no rack letters provided, we're done - the regex match is sufficient
  if (!rackLetters) return true;

  // Process digraphs in rack letters
  const processedRack = processDigraphs(rackLetters);
  
  console.log('Pattern validation:', {
    word,
    pattern,
    originalRack: rackLetters,
    processedRack,
    processedWord,
    processedPattern
  });

  // Extract fixed letters from pattern (excluding ? and -)
  const fixedLetters = processedPattern
    .split('-')
    .join('')
    .replace(/\?/g, '')
    .toUpperCase();

  // Create frequency maps for rack letters and handle wildcards
  const availableLetters = new Map<string, number>();
  let wildcardCount = 0;

  for (const letter of processedRack) {
    if (letter === '*') {
      wildcardCount++;
    } else {
      availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
    }
  }

  // Add fixed letters to available letters
  for (const letter of fixedLetters) {
    availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
  }

  // Count letters needed for the word
  const neededLetters = new Map<string, number>();
  for (const letter of processedWord) {
    neededLetters.set(letter, (neededLetters.get(letter) || 0) + 1);
  }

  // Check if we have enough letters, considering wildcards
  let remainingWildcards = wildcardCount;
  for (const [letter, count] of neededLetters) {
    const available = availableLetters.get(letter) || 0;
    if (count > available) {
      // If we don't have enough of this letter, try to use wildcards
      const needed = count - available;
      if (needed > remainingWildcards) return false;
      remainingWildcards -= needed;
    }
  }

  return true;
};

export const findPatternMatches = (pattern: string, trie: Trie): string[] => {
  const results: string[] = [];
  const [boardPattern, rackLetters] = pattern.split(',').map(p => p?.trim().toUpperCase());
  
  if (!boardPattern) return results;

  // Process the pattern to handle digraphs
  const processedPattern = processDigraphs(boardPattern);
  console.log('Pattern search:', {
    originalPattern: boardPattern,
    processedPattern,
    rackLetters
  });

  // Create regex for the pattern
  const regex = convertPatternToRegex(processedPattern);
  console.log('Generated regex:', regex);

  // Get all words from trie and filter them
  const allWords = trie.getAllWords();
  return allWords.filter(word => validateWordPattern(word, processedPattern, rackLetters));
};