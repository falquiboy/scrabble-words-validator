import { Trie } from '@/utils/trie/types';
import { processDigraphs } from '@/utils/digraphs';
import { validateWordPattern } from './validation';

export const findPatternMatches = (pattern: string, trie: Trie): string[] => {
  // Early return if no pattern
  if (!pattern) return [];

  // Split pattern and rack letters, defaulting to empty string for rack
  const [boardPattern = '', rackLetters = ''] = pattern.split(',').map(p => p?.trim().toUpperCase());
  
  // Process pattern for digraphs once
  const processedPattern = processDigraphs(boardPattern);
  
  console.log('Pattern search:', {
    pattern: boardPattern,
    processedPattern,
    rackLetters
  });

  // Get words and filter in one pass
  return trie.getAllWords()
    .filter(word => validateWordPattern(word, processedPattern, rackLetters));
};