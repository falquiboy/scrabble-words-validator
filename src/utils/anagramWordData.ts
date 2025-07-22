import { supabase } from "@/integrations/supabase/client";

export interface AnagramWordInfo {
  word: string;
  lemma?: string;
  partOfSpeech?: string;
  wordType?: 'femenino' | 'plural' | 'conjugación' | 'variante' | 'base';
  shortDefinition?: string; // First 50 characters
  isScrabbleValid?: boolean;
}

export async function fetchAnagramWordsData(words: string[]): Promise<Map<string, AnagramWordInfo>> {
  const results = new Map<string, AnagramWordInfo>();
  
  if (words.length === 0) return results;

  try {
    // Batch query to get word information from scrabble_words table
    const { data: scrabbleData } = await supabase
      .from('scrabble_words')
      .select('word, key_lemma, key_feminine, key_plural, key_conj, key_variant')
      .in('word', words.map(w => w.toUpperCase()));

    // Get unique keys to fetch dictionary entries
    const allKeys = new Set<number>();
    const wordToKeys = new Map<string, any>();

    if (scrabbleData) {
      scrabbleData.forEach(row => {
        wordToKeys.set(row.word, row);
        
        // Collect all keys that aren't null
        if (row.key_lemma) allKeys.add(row.key_lemma);
        if (row.key_feminine) allKeys.add(row.key_feminine);
        if (row.key_plural) allKeys.add(row.key_plural);
        if (row.key_conj) allKeys.add(row.key_conj);
        if (row.key_variant) allKeys.add(row.key_variant);
      });
    }

    // Fetch dictionary entries for the keys
    let entriesData: any[] = [];
    if (allKeys.size > 0) {
      const { data: entries } = await supabase
        .from('dictionary_entries')
        .select(`
          key,
          lemma,
          dictionary_senses (
            definition,
            part_of_speech_1
          )
        `)
        .in('key', Array.from(allKeys))
        .limit(1000); // Reasonable limit

      entriesData = entries || [];
    }

    // Create a map of key to entry info
    const keyToEntry = new Map();
    entriesData.forEach(entry => {
      keyToEntry.set(entry.key, entry);
    });

    // Process each word
    words.forEach(word => {
      const upperWord = word.toUpperCase();
      const scrabbleInfo = wordToKeys.get(upperWord);
      
      const wordInfo: AnagramWordInfo = {
        word,
        isScrabbleValid: !!scrabbleInfo
      };

      if (scrabbleInfo) {
        // Determine word type and get corresponding entry
        let primaryKey: number | null = null;
        let wordType: AnagramWordInfo['wordType'] = 'base';

        if (scrabbleInfo.key_lemma) {
          primaryKey = scrabbleInfo.key_lemma;
          wordType = 'base';
        } else if (scrabbleInfo.key_feminine) {
          primaryKey = scrabbleInfo.key_feminine;
          wordType = 'femenino';
        } else if (scrabbleInfo.key_plural) {
          primaryKey = scrabbleInfo.key_plural;
          wordType = 'plural';
        } else if (scrabbleInfo.key_conj) {
          primaryKey = scrabbleInfo.key_conj;
          wordType = 'conjugación';
        } else if (scrabbleInfo.key_variant) {
          primaryKey = scrabbleInfo.key_variant;
          wordType = 'variante';
        }

        if (primaryKey && keyToEntry.has(primaryKey)) {
          const entry = keyToEntry.get(primaryKey);
          wordInfo.lemma = entry.lemma;
          wordInfo.wordType = wordType;
          
          // Get first definition and part of speech
          if (entry.dictionary_senses && entry.dictionary_senses.length > 0) {
            const firstSense = entry.dictionary_senses[0];
            wordInfo.partOfSpeech = firstSense.part_of_speech_1 || undefined;
            
            if (firstSense.definition) {
              // Process definition to 50 characters
              let definition = firstSense.definition.trim();
              // Remove common abbreviations at the start
              definition = definition.replace(/^[VvUu]\.\s*[tc]\.\s*[cs]\.\s*/, '');
              definition = definition.replace(/^[VvUu]\.\s*/, '');
              
              if (definition.length > 50) {
                definition = definition.substring(0, 47) + '...';
              }
              wordInfo.shortDefinition = definition;
            }
          }
        }
      }

      results.set(word, wordInfo);
    });

  } catch (error) {
    console.error('Error fetching anagram words data:', error);
    
    // Return basic info for all words
    words.forEach(word => {
      results.set(word, { word, isScrabbleValid: false });
    });
  }

  return results;
}