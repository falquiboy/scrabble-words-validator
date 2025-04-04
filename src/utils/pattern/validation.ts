
import { processDigraphs } from '@/utils/digraphs';
import { convertPatternToRegex } from './conversion';

export const validateWordPattern = (
  word: string,
  pattern: string,
  rackLetters?: string
): boolean => {
  // First process the word with digraphs
  const processedWord = processDigraphs(word);
  console.log('Validating pattern:', { word, processedWord, pattern });
  
  // For the pattern, we need to handle special characters differently
  // We'll split the pattern into parts that should and shouldn't be processed
  const parts = pattern.split(/([?^$\-])/);
  const processedParts = parts.map(part => {
    // Don't process special characters
    if (part === '?' || part === '^' || part === '$' || part === '-') return part;
    // Process other parts for digraphs
    return processDigraphs(part);
  });
  const processedPattern = processedParts.join('');

  // Quick regex check using the processed pattern
  const regex = convertPatternToRegex(processedPattern);
  console.log('Pattern matching:', { word, processedWord, pattern, processedPattern, regex });
  
  if (!regex.test(processedWord)) {
    return false;
  }

  // If no rack letters provided, pattern match is sufficient
  if (!rackLetters || rackLetters.trim() === '') {
    return true;
  }

  // Process rack letters and count available letters
  const processedRack = processDigraphs(rackLetters);
  const letterCounts = new Map<string, number>();
  let wildcards = 0;

  // Count rack letters
  for (const letter of processedRack) {
    if (letter === '*') {
      wildcards++;
    } else {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }
  }

  // For wildcard matches (?) in the pattern, we need to check if
  // we have enough letters in the rack to fill them
  const wildcardCount = (pattern.match(/\?/g) || []).length;
  const requiredLetters = [...processedWord]; // Letters in the word

  // Check if we have enough letters to fill the wildcards
  for (const letter of requiredLetters) {
    const count = letterCounts.get(letter) || 0;
    
    // If we have this letter in our rack, use it
    if (count > 0) {
      letterCounts.set(letter, count - 1);
    } 
    // If we don't have this letter in our rack but have a wildcard, use that
    else if (wildcards > 0) {
      wildcards--;
    } 
    // If we don't have this letter or a wildcard, check if it's part of the fixed pattern
    else {
      // If the letter doesn't match a fixed character in the pattern
      // and we don't have it in our rack or a wildcard, the match fails
      const patternWithoutWildcards = pattern.replace(/\?/g, '');
      if (!processDigraphs(patternWithoutWildcards).includes(letter)) {
        return false;
      }
    }
  }

  return true;
};
