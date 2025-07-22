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

  console.log('🔍 fetchAnagramWordsData called with:', words);

  try {
    // First, try the words table which we know exists
    console.log('📊 Trying words table first...');
    const upperWords = words.map(w => w.toUpperCase());
    
    const { data: wordsData, error: wordsError } = await supabase
      .from('words')
      .select('word')
      .in('word', upperWords);

    if (wordsError) {
      console.error('❌ Words table error:', wordsError);
    } else {
      console.log('✅ Words table response:', wordsData);
    }

    // Try scrabble_words table if it exists
    console.log('📊 Trying scrabble_words table...');
    const { data: scrabbleData, error: scrabbleError } = await supabase
      .from('scrabble_words')
      .select('word, key_lemma, key_feminine, key_plural, key_conj, key_variant')
      .in('word', upperWords);

    if (scrabbleError) {
      console.error('❌ Scrabble words table error:', scrabbleError);
    } else {
      console.log('✅ Scrabble words table response:', scrabbleData);
    }

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

    // For now, let's create basic word info from words table
    const validWords = new Set(wordsData?.map(w => w.word) || []);
    
    // Process each word
    words.forEach(word => {
      const upperWord = word.toUpperCase();
      const isValid = validWords.has(upperWord);
      
      const wordInfo: AnagramWordInfo = {
        word,
        isScrabbleValid: isValid,
        // Temporary: Add some sample data to see if UI works
        ...(isValid ? {
          lemma: word.toLowerCase(),
          partOfSpeech: 'sustantivo',
          wordType: 'base' as const,
          shortDefinition: `Definición temporal de ${word.toLowerCase()}`
        } : {})
      };

      console.log(`✅ Processed word: ${word}`, wordInfo);
      results.set(word, wordInfo);
    });

    console.log('🎯 Final results map:', results);

  } catch (error) {
    console.error('Error fetching anagram words data:', error);
    
    // Return basic info for all words
    words.forEach(word => {
      results.set(word, { word, isScrabbleValid: false });
    });
  }

  return results;
}