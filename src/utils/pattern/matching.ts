import { Trie } from '@/utils/trie/types';
import { processDigraphs } from '@/utils/digraphs';
import { validateWordPattern } from './validation';
import { supabase } from '@/integrations/supabase/client';

export const findPatternMatches = async (pattern: string, trie: Trie): Promise<string[]> => {
  if (!pattern) return [];

  const [boardPattern = '', rackLetters = ''] = pattern.split(',');
  const trimmedPattern = boardPattern.trim().toUpperCase();
  
  console.log('Pattern search:', {
    pattern: trimmedPattern,
    rackLetters: rackLetters.trim()
  });

  // Process digraphs in the pattern
  const processedPattern = processDigraphs(trimmedPattern);
  console.log('Processed pattern:', processedPattern);

  // Convert pattern to SQL LIKE pattern
  let sqlPattern = processedPattern
    .replace(/\?/g, '_')  // ? becomes _ (single character wildcard)
    .replace(/-/g, '%');  // - becomes % (multiple character wildcard)

  // If pattern doesn't start with %, add ^ anchor
  if (!sqlPattern.startsWith('%')) {
    sqlPattern = '^' + sqlPattern;
  }
  
  // If pattern doesn't end with %, add $ anchor
  if (!sqlPattern.endsWith('%')) {
    sqlPattern += '$';
  }

  console.log('SQL pattern:', sqlPattern);

  try {
    const { data: matches, error } = await supabase
      .from('words')
      .select('word')
      .ilike('word', sqlPattern)
      .order('word');

    if (error) {
      console.error('Pattern search error:', error);
      return [];
    }

    console.log('Raw matches:', matches);

    // If we have rack letters, we need to filter the results
    if (rackLetters.trim()) {
      return matches
        .map(m => m.word)
        .filter(word => validateWordPattern(word, trimmedPattern, rackLetters.trim()));
    }

    return matches.map(m => m.word);
  } catch (err) {
    console.error('Pattern search error:', err);
    return [];
  }
};