import { supabase } from "@/integrations/supabase/client";
import { fetchBatchVerbInfo, VerbInfo } from "./verbData";
import { processDigraphs } from "./digraphs";

// Cache local para evitar queries repetidas de anagramWordData
const anagramWordCache = new Map<string, AnagramWordInfo>();
const ANAGRAM_CACHE_STATS = { hits: 0, misses: 0 };
const MAX_CACHE_ENTRIES = 1_500;
const WORD_INFO_BATCH_SIZE = 100;
const inFlightBatches = new Map<string, Promise<Map<string, AnagramWordInfo>>>();

export interface AnagramWordInfo {
  word: string;
  lemma?: string;
  partOfSpeech?: string;
  wordType?: 'femenino' | 'plural' | 'conjugación' | 'variante' | 'base';
  shortDefinition?: string; // Complete definition
  isScrabbleValid?: boolean;
  // Verb-specific information
  isVerb?: boolean;
  verbInfo?: VerbInfo;
}

interface AnagramWordInfoRpcRow {
  norm_word: string;
  lemma: string | null;
  part_of_speech: string | null;
  word_type: AnagramWordInfo['wordType'] | null;
  short_definition: string | null;
  is_scrabble_valid: boolean;
  is_verb: boolean;
  entry_key: number | null;
  norm_lemma: string | null;
  prime_sense: string | null;
  prime_type: string | null;
  regularity: string | null;
  participle_masculine: string | null;
  has_participle_masculine: boolean | null;
  participle_masculine_plural: string | null;
  has_participle_masculine_plural: boolean | null;
  participle_feminine: string | null;
  has_participle_feminine: boolean | null;
  prnl_end: string | null;
  voseo_imperative_plural: string | null;
  has_voseo_imperative: boolean | null;
  is_prnl_end: boolean | null;
}

const cacheWordInfo = (word: string, wordInfo: AnagramWordInfo): void => {
  anagramWordCache.delete(word);
  anagramWordCache.set(word, wordInfo);
  while (anagramWordCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = anagramWordCache.keys().next().value;
    if (!oldestKey) break;
    anagramWordCache.delete(oldestKey);
  }
};

const getCachedWordInfo = (word: string): AnagramWordInfo | undefined => {
  const cached = anagramWordCache.get(word);
  if (!cached) return undefined;
  anagramWordCache.delete(word);
  anagramWordCache.set(word, cached);
  return cached;
};

const toVerbInfo = (row: AnagramWordInfoRpcRow): VerbInfo | undefined => {
  if (!row.is_verb || !row.norm_lemma || row.entry_key === null) return undefined;
  return {
    entry_key: row.entry_key,
    norm_lemma: row.norm_lemma,
    prime_sense: row.prime_sense || '',
    prime_type: row.prime_type || '',
    regularity: row.regularity || '',
    participle_masculine: row.participle_masculine || undefined,
    has_participle_masculine: row.has_participle_masculine || undefined,
    participle_masculine_plural: row.participle_masculine_plural || undefined,
    has_participle_masculine_plural: row.has_participle_masculine_plural || undefined,
    participle_feminine: row.participle_feminine || undefined,
    has_participle_feminine: row.has_participle_feminine || undefined,
    prnl_end: row.prnl_end || undefined,
    voseo_imperative_plural: row.voseo_imperative_plural || undefined,
    has_voseo_imperative: row.has_voseo_imperative || undefined,
    is_prnl_end: row.is_prnl_end || undefined,
  };
};

const fetchRpcWordInfo = async (normalizedWords: string[]): Promise<Map<string, AnagramWordInfo>> => {
  const rpc = supabase.rpc as unknown as (
    functionName: string,
    args: { p_words: string[] }
  ) => Promise<{ data: AnagramWordInfoRpcRow[] | null; error: { message: string } | null }>;
  const { data, error } = await rpc('get_anagram_word_info_v1', { p_words: normalizedWords });
  if (error) throw new Error(error.message);

  const result = new Map<string, AnagramWordInfo>();
  for (const row of data || []) {
    const verbInfo = toVerbInfo(row);
    result.set(row.norm_word, {
      word: row.norm_word,
      lemma: row.lemma || row.norm_lemma || row.norm_word.toLowerCase(),
      partOfSpeech: row.part_of_speech || '',
      wordType: row.word_type || 'base',
      shortDefinition: row.short_definition || '',
      isScrabbleValid: row.is_scrabble_valid,
      isVerb: row.is_verb,
      verbInfo,
    });
  }
  return result;
};

export async function fetchAnagramWordsData(words: string[]): Promise<Map<string, AnagramWordInfo>> {
  const uniqueWords = Array.from(new Set(words.filter(Boolean)));
  const results = new Map<string, AnagramWordInfo>();
  const missingWords: string[] = [];

  for (const word of uniqueWords) {
    const cached = getCachedWordInfo(word);
    if (cached) {
      ANAGRAM_CACHE_STATS.hits++;
      results.set(word, cached);
    } else {
      missingWords.push(word);
    }
  }

  if (missingWords.length === 0) return results;
  ANAGRAM_CACHE_STATS.misses += missingWords.length;

  const normalizedToOriginal = new Map<string, string[]>();
  for (const word of missingWords) {
    const normalized = processDigraphs(word.toUpperCase());
    const originals = normalizedToOriginal.get(normalized) || [];
    originals.push(word);
    normalizedToOriginal.set(normalized, originals);
  }

  const normalizedWords = [...normalizedToOriginal.keys()];
  const batches: string[][] = [];
  for (let index = 0; index < normalizedWords.length; index += WORD_INFO_BATCH_SIZE) {
    batches.push(normalizedWords.slice(index, index + WORD_INFO_BATCH_SIZE));
  }

  const batchResults = await Promise.all(batches.map(async (batch) => {
    const batchKey = batch.slice().sort().join('|');
    let request = inFlightBatches.get(batchKey);
    if (!request) {
      request = fetchRpcWordInfo(batch).catch(async (rpcError) => {
        console.warn('Word-info RPC unavailable; using legacy batch fallback.', rpcError);
        return fetchLegacyAnagramWordsData(
          batch.flatMap((normalized) => normalizedToOriginal.get(normalized) || [])
        );
      });
      inFlightBatches.set(batchKey, request);
      void request.finally(() => {
        if (inFlightBatches.get(batchKey) === request) inFlightBatches.delete(batchKey);
      }).catch(() => undefined);
    }
    return request;
  }));

  for (const batchResult of batchResults) {
    for (const [normalizedWord, normalizedInfo] of batchResult) {
      const originals = normalizedToOriginal.get(processDigraphs(normalizedWord.toUpperCase())) || [normalizedWord];
      for (const original of originals) {
        const wordInfo = { ...normalizedInfo, word: original };
        cacheWordInfo(original, wordInfo);
        results.set(original, wordInfo);
      }
    }
  }

  return results;
}

async function fetchLegacyAnagramWordsData(words: string[]): Promise<Map<string, AnagramWordInfo>> {
  const results = new Map<string, AnagramWordInfo>();
  
  if (words.length === 0) return results;

  console.log(`🔍 fetchAnagramWordsData called with ${words.length} words - checking cache first`);

  // Separar palabras cacheadas vs no cacheadas (mismo patrón que leaves/hooks)
  const uncachedWords: string[] = [];
  
  for (const word of words) {
    const cached = getCachedWordInfo(word);
    if (cached) {
      ANAGRAM_CACHE_STATS.hits++;
      results.set(word, cached);
      console.log(`🎯 AnagramWord Cache HIT for: ${word}`);
    } else {
      uncachedWords.push(word);
    }
  }

  // Si todas estaban en cache, devolver resultados
  if (uncachedWords.length === 0) {
    console.log(`🚀 All ${words.length} anagram words found in cache - no database queries needed!`);
    return results;
  }

  console.log(`🔍 Cache MISS for ${uncachedWords.length} words, querying database...`);
  ANAGRAM_CACHE_STATS.misses += uncachedWords.length;

  try {
    // Words are already in uppercase from ResultsList
    
    // Step 1: Query lexicon_keys table first to determine word types through key assignments
    console.log('📊 Step 1: Querying lexicon_keys table...');
    
    // Normalize uncached words (uppercase + digraph processing for lexicon_keys lookup)
    const normalizedWords = uncachedWords.map(word => {
      const normalized = processDigraphs(word.toUpperCase());
      if (word.includes('LL') || word.includes('CH') || word.includes('RR')) {
        console.log(`📊 Digraph conversion: ${word} → ${normalized}`);
      }
      return normalized;
    });
    console.log('📊 Normalized uncached words (with digraphs processed for lexicon_keys) for query:', normalizedWords);
    console.log('📊 Original uncached words:', uncachedWords);
    
    // Create mapping from normalized word back to original words for result association
    const normalizedToOriginal = new Map<string, string[]>();
    uncachedWords.forEach(originalWord => {
      const normalized = processDigraphs(originalWord.toUpperCase()); // Process digraphs for lexicon_keys lookup
      if (!normalizedToOriginal.has(normalized)) {
        normalizedToOriginal.set(normalized, []);
      }
      normalizedToOriginal.get(normalized)!.push(originalWord);
    });
    
    const { data: scrabbleData, error: scrabbleError } = await supabase
      .from('lexicon_keys')
      .select('norm_word, key_lemma, key_feminine, key_plural, key_conj, key_variant')
      .in('norm_word', normalizedWords);

    if (scrabbleError) {
      console.error('❌ Lexicon keys table error:', scrabbleError);
      throw scrabbleError;
    }

    console.log('✅ Lexicon keys response:', scrabbleData);
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
        // Map normalized word to database row
        wordToKeys.set(row.norm_word, row);
        wordToKeys.set(row.norm_word.toUpperCase(), row);
        
        // Also map all original words that normalize to this result
        const originalWords = normalizedToOriginal.get(row.norm_word) || [];
        originalWords.forEach(originalWord => {
          wordToKeys.set(originalWord, row);
          wordToKeys.set(originalWord.toUpperCase(), row);
        });
        
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
        
        wordTypes.set(row.norm_word, wordType);
        wordTypes.set(row.norm_word.toUpperCase(), wordType);
        
        // Also map word types for all original words that normalize to this result
        originalWords.forEach(originalWord => {
          wordTypes.set(originalWord, wordType);
          wordTypes.set(originalWord.toUpperCase(), wordType);
        });
      });
    }

    console.log('📝 Word types determined:', Object.fromEntries(wordTypes));
    console.log('🔑 All keys to fetch:', Array.from(allKeys));

    // Step 3: Fetch dictionary information using the keys
    const keyToEntry = new Map();
    const keyToSenses = new Map();
    
    if (allKeys.size > 0) {
      // Convert keys to numbers for database query (they're stored as numeric type)
      const numericKeys = Array.from(allKeys).map(k => Number(k));
      
      // Entries and senses are independent once the key set is known.
      const entriesRequest = supabase
        .from('dictionary_entries')
        .select('key, lemma, etymology_info')
        .in('key', numericKeys);
      const sensesRequest = supabase
        .from('dictionary_senses')
        .select('entry_key, definition, part_of_speech_1')
        .in('entry_key', numericKeys)
        .order('entry_key')
        .order('sense_number');
      const [
        { data: entries, error: entriesError },
        { data: senses, error: sensesError }
      ] = await Promise.all([entriesRequest, sensesRequest]);

      if (entriesError) {
        console.error('❌ Dictionary entries error:', entriesError);
      } else {
        console.log('✅ Dictionary entries response:', entries);
        if (entries) {
          entries.forEach(entry => {
            // Store with both the numeric key and string representation for lookup flexibility
            keyToEntry.set(Number(entry.key), entry);
            keyToEntry.set(String(entry.key), entry);
          });
        }
      }

      if (sensesError) {
        console.error('❌ Dictionary senses error:', sensesError);
      } else {
        console.log('✅ Dictionary senses response:', senses);
        if (senses) {
          // Group senses by entry_key (store with both numeric and string keys)
          senses.forEach(sense => {
            const numKey = Number(sense.entry_key);
            const strKey = String(sense.entry_key);
            
            if (!keyToSenses.has(numKey)) {
              keyToSenses.set(numKey, []);
            }
            keyToSenses.get(numKey).push(sense);
            
            // Also store with string key for lookup flexibility
            if (!keyToSenses.has(strKey)) {
              keyToSenses.set(strKey, []);
            }
            keyToSenses.get(strKey).push(sense);
          });
        }
      }
    }

    // Helper function to normalize lemma by removing homonym digit
    const normalizeLemma = (lemma: string) => {
      // Remove digit at the end for homonym normalization (e.g., "ser2" → "ser")
      return lemma.replace(/\d+$/, '');
    };

    // Step 4: Collect all potential verb lemmas for batch query
    console.log('🔄 Step 4a: Collecting potential verb lemmas for batch query...');
    const potentialVerbLemmas = new Set<string>();
    
    for (const word of uncachedWords) {
      const scrabbleInfo = wordToKeys.get(word);
      if (scrabbleInfo) {
        const parseKeys = (keyString: string) => {
          if (!keyString) return null;
          const keys = keyString.split(',').map(k => parseFloat(k.trim())).filter(k => !isNaN(k));
          return keys.length > 0 ? Math.min(...keys) : null;
        };

        const primaryKey = parseKeys(scrabbleInfo.key_conj) ||
                        parseKeys(scrabbleInfo.key_feminine) || 
                        parseKeys(scrabbleInfo.key_plural) || 
                        parseKeys(scrabbleInfo.key_variant) ||
                        parseKeys(scrabbleInfo.key_lemma);
        
        const entry = keyToEntry.get(primaryKey);
        let lemmaToCheck = entry?.lemma || word.toLowerCase();
        
        // Normalize lemma by removing homonym digit for verb lookup
        const normalizedLemma = normalizeLemma(lemmaToCheck);
        
        // Add both the normalized lemma and base form (without -se) for pronominal verbs
        potentialVerbLemmas.add(normalizedLemma);
        if (normalizedLemma.endsWith('se')) {
          potentialVerbLemmas.add(normalizedLemma.slice(0, -2)); // Remove 'se'
        }
      }
    }

    // Batch query para todos los verbos potenciales
    console.log(`🚀 Step 4b: Batch querying ${potentialVerbLemmas.size} potential verb lemmas...`);
    const verbInfoMap = potentialVerbLemmas.size > 0 
      ? await fetchBatchVerbInfo(Array.from(potentialVerbLemmas))
      : new Map<string, VerbInfo | null>();

    // Step 4c: Process each uncached word and build final results
    console.log('🔄 Step 4c: Processing uncached words...');
    for (const word of uncachedWords) {
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
        
        // Get verb info from batch result (NO individual queries!)
        let lemmaToCheck = entry?.lemma || word.toLowerCase();
        let verbInfo = null;
        
        // Normalize lemma for verb lookup (remove homonym digits like "ser2" → "ser")
        const normalizedLemmaForLookup = normalizeLemma(lemmaToCheck);
        
        // Check batch results for verb info using normalized lemma
        if (normalizedLemmaForLookup.endsWith('se')) {
          const baseForm = normalizedLemmaForLookup.slice(0, -2); // Remove 'se'
          console.log(`🔄 Checking pronominal verb in batch results: ${lemmaToCheck} → ${normalizedLemmaForLookup} → ${baseForm}`);
          verbInfo = verbInfoMap.get(baseForm);
          if (!verbInfo) {
            // Fallback to full normalized lemma from batch results
            verbInfo = verbInfoMap.get(normalizedLemmaForLookup);
          }
          if (verbInfo) {
            console.log(`✅ Found verb info in batch for: ${verbInfo.norm_lemma}`, verbInfo);
          }
        } else {
          console.log(`🔄 Checking normalized verb in batch results: ${lemmaToCheck} → ${normalizedLemmaForLookup}`);
          verbInfo = verbInfoMap.get(normalizedLemmaForLookup);
          if (verbInfo) {
            console.log(`✅ Found verb info in batch for: ${normalizedLemmaForLookup}`, verbInfo);
          }
        }
        
        let shortDefinition = '';
        let partOfSpeech = '';
        
        if (verbInfo) {
          // Use verb-specific information
          console.log(`🌟 Found verb info for: ${word}`, verbInfo);
          shortDefinition = verbInfo.prime_sense || '';
          partOfSpeech = 'verbo';
        } else {
          // Use dictionary senses
          if (senses.length > 0) {
            const firstSense = senses[0];
            if (firstSense.definition) {
              shortDefinition = firstSense.definition;
            }
            partOfSpeech = firstSense.part_of_speech_1 || '';
          }
        }
        
        const wordInfo: AnagramWordInfo = {
          word,
          isScrabbleValid: true,
          lemma: entry?.lemma || verbInfo?.norm_lemma || word.toLowerCase(),
          partOfSpeech,
          wordType: wordType as 'femenino' | 'plural' | 'conjugación' | 'variante' | 'base',
          shortDefinition,
          isVerb: !!verbInfo,
          verbInfo: verbInfo || undefined
        };
        
        console.log(`✅ Processed valid word: ${word}`, wordInfo);
        
        // Guardar en cache Y en results
        cacheWordInfo(word, wordInfo);
        results.set(word, wordInfo);
      } else {
        // Word not found in lexicon_keys
        const wordInfo: AnagramWordInfo = {
          word,
          isScrabbleValid: false
        };
        
        console.log(`❌ Word not valid for Scrabble: ${word}`);
        
        // Guardar en cache Y en results (incluso invalid words para evitar re-queries)
        cacheWordInfo(word, wordInfo);
        results.set(word, wordInfo);
      }
    }

    // Log performance improvement
    console.log(`🚀 AnagramWord optimization: ${uncachedWords.length} words processed with ${potentialVerbLemmas.size} verb batch queries (vs ${uncachedWords.length} individual verb calls)`);
    
    // Log cache stats periodically
    if ((ANAGRAM_CACHE_STATS.hits + ANAGRAM_CACHE_STATS.misses) % 20 === 0) {
      const total = ANAGRAM_CACHE_STATS.hits + ANAGRAM_CACHE_STATS.misses;
      const hitRate = ((ANAGRAM_CACHE_STATS.hits / total) * 100).toFixed(1);
      console.log(`📊 AnagramWord Cache Stats: ${ANAGRAM_CACHE_STATS.hits}/${total} hits (${hitRate}% hit rate)`);
    }

  } catch (error) {
    console.error('❌ Error fetching anagram words data:', error);
    
    // Return basic info for uncached words on error (cached already in results)
    uncachedWords.forEach(word => {
      const errorWordInfo: AnagramWordInfo = { word, isScrabbleValid: false };
      results.set(word, errorWordInfo);
    });
  }

  return results;
}
