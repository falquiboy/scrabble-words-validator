import { Trie } from '@/utils/trie/types';
import { processDigraphs } from '@/utils/digraphs';
import { validateWordPattern } from './validation';
import { supabase } from '@/integrations/supabase/client';

export const findPatternMatches = async (pattern: string, trie: Trie): Promise<string[]> => {
  if (!pattern) return [];

  const [boardPattern = '', rackLetters = ''] = pattern.split(',').map(p => p?.trim().toUpperCase());
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
    .replace(/\^/g, '')   // Remove start anchor
    .replace(/\$/g, '');  // Remove end anchor

  // Handle start/end anchors and hyphens
  const hasStartHyphen = trimmedPattern.startsWith('-');
  const hasEndHyphen = trimmedPattern.endsWith('-');

  // Remove hyphens for SQL pattern construction
  sqlPattern = sqlPattern.replace(/-/g, '');

  // Add SQL wildcards based on hyphens
  if (hasStartHyphen && hasEndHyphen) {
    sqlPattern = '%' + sqlPattern + '%';
  } else if (hasStartHyphen) {
    sqlPattern = '%' + sqlPattern;
  } else if (hasEndHyphen) {
    sqlPattern = sqlPattern + '%';
  }

  console.log('SQL pattern:', sqlPattern);

  try {
    // Get all words that match the pattern length and LIKE pattern
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

    // If we have rack letters, filter the results
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