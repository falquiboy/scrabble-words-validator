import { Trie } from '@/utils/trie/types';
import { processDigraphs } from '@/utils/digraphs';
import { validateWordPattern } from './validation';

export const findPatternMatches = (pattern: string, trie: Trie): string[] => {
  if (!pattern) return [];

  const [boardPattern = '', rackLetters = ''] = pattern.split(',');
  const trimmedPattern = boardPattern.trim().toUpperCase();
  
  console.log('Pattern search:', {
    pattern: trimmedPattern,
    rackLetters: rackLetters.trim()
  });

  // Get all words at once and filter
  const matches = trie.getAllWords()
    .filter(word => validateWordPattern(word, trimmedPattern, rackLetters.trim()));

  console.log('Pattern matches found:', matches);
  return matches;
};