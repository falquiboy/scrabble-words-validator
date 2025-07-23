import { supabase } from "@/integrations/supabase/client";
import { fetchVerbInfo, VerbInfo } from "./verbData";

export interface AnagramWordInfo {
  word: string;
  lemma?: string;
  partOfSpeech?: string;
  wordType?: 'femenino' | 'plural' | 'conjugación' | 'variante' | 'base';
  shortDefinition?: string; // First 50 characters
  isScrabbleValid?: boolean;
  // Verb-specific information
  isVerb?: boolean;
  verbInfo?: VerbInfo;
}

export async function fetchAnagramWordsData(words: string[]): Promise<Map<string, AnagramWordInfo>> {
  const results = new Map<string, AnagramWordInfo>();
  
  if (words.length === 0) return results;

  console.log('🔍 fetchAnagramWordsData called with:', words);
  console.log('🔍 Words already formatted and ready to query:', words);

  try {
    // Words are already in uppercase from ResultsList
    
    // Step 1: Query scrabble_words table first to determine word types through key assignments
    console.log('📊 Step 1: Querying scrabble_words table...');
    
    // Convert words to lowercase for the query since scrabble_words are in natural case
    const lowerWords = words.map(word => word.toLowerCase());
    console.log('📊 Converted to lowercase for query:', lowerWords);
    
    const { data: scrabbleData, error: scrabbleError } = await supabase
      .from('scrabble_words')
      .select('word, key_lemma, key_feminine, key_plural, key_conj, key_variant')
      .in('word', lowerWords);

    if (scrabbleError) {
      console.error('❌ Scrabble words table error:', scrabbleError);
      throw scrabbleError;
    }

    console.log('✅ Scrabble words response:', scrabbleData);
    console.log('✅ Number of rows returned:', scrabbleData?.length || 0);
    if (scrabbleData && scrabbleData.length > 0) {
      console.log('✅ First row example:', scrabbleData[0]);
    }

    // Step 2: Determine word types and collect all keys
    const allKeys = new Set<number>();
    const wordToKeys = new Map<string, Record<string, string>>();
    const wordTypes = new Map<string, string>();

    if (scrabbleData && scrabbleData.length > 0) {
      scrabbleData.forEach(row => {
        // Map both lowercase and uppercase versions to handle the conversion
        wordToKeys.set(row.word, row);
        wordToKeys.set(row.word.toUpperCase(), row);
        
        // Helper function to parse keys (handle comma-separated and decimal values)
        const parseKeys = (keyString: string) => {
          if (!keyString) return [];
          return keyString.split(',').map(k => parseFloat(k.trim())).filter(k => !isNaN(k));
        };

        // Determine word type with priority: conjugación first, then others
        // Within each type, use the smallest key (earliest/etymological antecedent)
        let wordType = 'base';
        let primaryKeys: number[] = [];
        
        // Priority 1: Conjugación (privileged)
        if (row.key_conj) {
          wordType = 'conjugación';
          primaryKeys = parseKeys(row.key_conj);
        }
        // Priority 2: Other types
        else if (row.key_feminine) {
          wordType = 'femenino';
          primaryKeys = parseKeys(row.key_feminine);
        } else if (row.key_plural) {
          wordType = 'plural';
          primaryKeys = parseKeys(row.key_plural);
        } else if (row.key_variant) {
          wordType = 'variante';
          primaryKeys = parseKeys(row.key_variant);
        } else if (row.key_lemma) {
          wordType = 'base';
          primaryKeys = parseKeys(row.key_lemma);
        }
        
        // Add all keys to the collection
        primaryKeys.forEach(key => allKeys.add(key));
        
        wordTypes.set(row.word, wordType);
        wordTypes.set(row.word.toUpperCase(), wordType);
      });
    }

    console.log('📝 Word types determined:', Object.fromEntries(wordTypes));
    console.log('🔑 All keys to fetch:', Array.from(allKeys));

    // Step 3: Fetch dictionary information using the keys
    const keyToEntry = new Map();
    const keyToSenses = new Map();
    
    if (allKeys.size > 0) {
      // Fetch dictionary entries
      console.log('📚 Step 3a: Fetching dictionary entries...');
      const { data: entries, error: entriesError } = await supabase
        .from('dictionary_entries')
        .select('key, lemma, etymology_info')
        .in('key', Array.from(allKeys));
      
      if (entriesError) {
        console.error('❌ Dictionary entries error:', entriesError);
      } else {
        console.log('✅ Dictionary entries response:', entries);
        if (entries) {
          entries.forEach(entry => {
            keyToEntry.set(entry.key, entry);
          });
        }
      }

      // Fetch dictionary senses
      console.log('📖 Step 3b: Fetching dictionary senses...');
      const { data: senses, error: sensesError } = await supabase
        .from('dictionary_senses')
        .select('entry_key, definition, part_of_speech_1')
        .in('entry_key', Array.from(allKeys));
      
      if (sensesError) {
        console.error('❌ Dictionary senses error:', sensesError);
      } else {
        console.log('✅ Dictionary senses response:', senses);
        if (senses) {
          // Group senses by entry_key
          senses.forEach(sense => {
            if (!keyToSenses.has(sense.entry_key)) {
              keyToSenses.set(sense.entry_key, []);
            }
            keyToSenses.get(sense.entry_key).push(sense);
          });
        }
      }
    }

    // Step 4: Process each word and build final results
    console.log('🔄 Step 4: Processing words...');
    for (const word of words) {
      const scrabbleInfo = wordToKeys.get(word);
      const wordType = wordTypes.get(word);
      
      if (scrabbleInfo) {
        // Word is valid for Scrabble
        // Helper function to parse and get smallest key (earliest/etymological antecedent)
        const parseKeys = (keyString: string) => {
          if (!keyString) return null;
          const keys = keyString.split(',').map(k => parseFloat(k.trim())).filter(k => !isNaN(k));
          return keys.length > 0 ? Math.min(...keys) : null;
        };

        // Priority order: conjugación first, then others
        const primaryKey = parseKeys(scrabbleInfo.key_conj) ||
                        parseKeys(scrabbleInfo.key_feminine) || 
                        parseKeys(scrabbleInfo.key_plural) || 
                        parseKeys(scrabbleInfo.key_variant) ||
                        parseKeys(scrabbleInfo.key_lemma);
        
        const entry = keyToEntry.get(primaryKey);
        const senses = keyToSenses.get(primaryKey) || [];
        
        console.log(`🔑 Word: ${word}, Type: ${wordType}, Primary Key: ${primaryKey} (smallest), Entry:`, entry);
        console.log(`🔍 Available keys - conj: ${scrabbleInfo.key_conj}, fem: ${scrabbleInfo.key_feminine}, plural: ${scrabbleInfo.key_plural}, variant: ${scrabbleInfo.key_variant}, lemma: ${scrabbleInfo.key_lemma}`);
        
        // Check if this is a verb by looking up in verb_entries
        const lemmaToCheck = entry?.lemma || word.toLowerCase();
        const verbInfo = await fetchVerbInfo(lemmaToCheck);
        
        let shortDefinition = '';
        let partOfSpeech = '';
        
        if (verbInfo) {
          // Use verb-specific information
          console.log(`🌟 Found verb info for: ${word}`, verbInfo);
          shortDefinition = verbInfo.prime_sense?.length > 50 
            ? verbInfo.prime_sense.substring(0, 50) + '...'
            : verbInfo.prime_sense || '';
          partOfSpeech = 'verbo';
        } else {
          // Use dictionary senses
          if (senses.length > 0) {
            const firstSense = senses[0];
            if (firstSense.definition) {
              shortDefinition = firstSense.definition.length > 50 
                ? firstSense.definition.substring(0, 50) + '...'
                : firstSense.definition;
            }
            partOfSpeech = firstSense.part_of_speech_1 || '';
          }
        }
        
        const wordInfo: AnagramWordInfo = {
          word,
          isScrabbleValid: true,
          lemma: verbInfo?.norm_lemma || entry?.lemma || word.toLowerCase(),
          partOfSpeech,
          wordType: wordType as 'femenino' | 'plural' | 'conjugación' | 'variante' | 'base',
          shortDefinition,
          isVerb: !!verbInfo,
          verbInfo: verbInfo || undefined
        };
        
        console.log(`✅ Processed valid word: ${word}`, wordInfo);
        results.set(word, wordInfo);
      } else {
        // Word not found in scrabble_words
        const wordInfo: AnagramWordInfo = {
          word,
          isScrabbleValid: false
        };
        
        console.log(`❌ Word not valid for Scrabble: ${word}`);
        results.set(word, wordInfo);
      }
    }

    console.log('🎯 Final results map:', Object.fromEntries(results));

  } catch (error) {
    console.error('❌ Error fetching anagram words data:', error);
    
    // Return basic info for all words on error
    words.forEach(word => {
      results.set(word, { word, isScrabbleValid: false });
    });
  }

  return results;
}