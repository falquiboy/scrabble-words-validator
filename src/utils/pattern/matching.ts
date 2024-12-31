import { Trie } from '@/utils/trie/types';
import { processDigraphs } from '@/utils/digraphs';
import { validateWordPattern } from './validation';

export const findPatternMatches = (pattern: string, trie: Trie): string[] => {
  if (!pattern) return [];

  const [boardPattern = '', rackLetters = ''] = pattern.split(',');
  
  // We'll process the pattern parts separately to preserve special characters
  const parts = boardPattern.trim().toUpperCase().split(/([?-])/);
  const processedParts = parts.map(part => {
    // Don't process special characters
    if (part === '?' || part === '-') return part;
    // Process other parts for digraphs
    return processDigraphs(part);
  });
  const processedPattern = processedParts.join('');
  
  console.log('Pattern search:', {
    pattern: boardPattern,
    processedPattern,
    rackLetters: rackLetters.trim()
  });

  // Get all words at once and filter
  return trie.getAllWords()
    .filter(word => validateWordPattern(word, processedPattern, rackLetters.trim()));
};