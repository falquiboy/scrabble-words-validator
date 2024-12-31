import { Trie } from '@/utils/trie/types';
import { processDigraphs } from '@/utils/digraphs';
import { validateWordPattern } from './validation';

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

  // Get all words from trie and filter them
  const allWords = trie.getAllWords();
  return allWords.filter(word => validateWordPattern(word, processedPattern, rackLetters));
};