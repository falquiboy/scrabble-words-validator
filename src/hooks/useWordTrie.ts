import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { processDigraphs } from '@/utils/digraphs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const EXPECTED_WORD_COUNT = 639293;
const BATCH_SIZE = 10000; // Reduced batch size for more stable fetching

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchWordsFromDB = async () => {
    try {
      let words = await wordDB.getAllWords();
      console.log('Words in local database:', words.length);

      if (words.length < EXPECTED_WORD_COUNT) {
        console.log('Local DB incomplete, fetching from Supabase...');
        
        let allWords: string[] = [];
        let currentOffset = 0;
        let lastProgress = 0;
        let retryCount = 0;
        const MAX_RETRIES = 3;
        
        while (currentOffset < EXPECTED_WORD_COUNT && retryCount < MAX_RETRIES) {
          try {
            console.log(`Fetching batch starting at offset: ${currentOffset}`);
            const { data, error } = await supabase
              .from('words')
              .select('word')
              .range(currentOffset, currentOffset + BATCH_SIZE - 1)
              .order('word');
            
            if (error) {
              console.error('Supabase fetch error:', error);
              retryCount++;
              if (retryCount >= MAX_RETRIES) {
                throw new Error(`Failed to fetch words after ${MAX_RETRIES} attempts: ${error.message}`);
              }
              continue;
            }
            
            if (!data || data.length === 0) {
              if (currentOffset === 0) {
                throw new Error('No words found in database');
              }
              break;
            }

            // Reset retry count on successful fetch
            retryCount = 0;
            
            const batchWords = data.map(w => w.word.toUpperCase());
            allWords.push(...batchWords);
            
            const currentProgress = Math.floor((allWords.length / EXPECTED_WORD_COUNT) * 100);
            if (currentProgress > lastProgress) {
              lastProgress = currentProgress;
              setLoadingProgress(currentProgress);
              console.log(`Loading progress: ${currentProgress}% (${allWords.length}/${EXPECTED_WORD_COUNT} words)`);
            }
            
            if (data.length < BATCH_SIZE) {
              // If we got less than batch size, we've reached the end
              break;
            }
            
            currentOffset += data.length; // Increment by actual number of words received
            
            // Add a small delay between batches to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error('Error in batch fetch:', error);
            retryCount++;
            if (retryCount >= MAX_RETRIES) {
              throw error;
            }
            // Wait a bit longer before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log('Total words fetched from Supabase:', allWords.length);
        
        if (allWords.length < EXPECTED_WORD_COUNT) {
          const errorMsg = `Incomplete dictionary: got ${allWords.length} words, expected ${EXPECTED_WORD_COUNT}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // Deduplicate words before saving
        words = [...new Set(allWords)];
        console.log('Unique words after deduplication:', words.length);
        
        // Clear and rebuild local DB
        await wordDB.clear();
        await wordDB.addWords(words);
        console.log('Words stored in local DB:', words.length);
      }
      
      return words;
    } catch (error) {
      console.error('Error fetching words:', error);
      throw error;
    }
  };

  const buildTrie = useCallback(async () => {
    try {
      console.log('Checking for serialized trie...');
      const serializedTrie = await wordDB.loadTrie();
      
      if (serializedTrie) {
        console.log('Found serialized trie, deserializing...');
        setLoadingProgress(50);
        trie.deserialize(serializedTrie);
        const words = trie.getAllWords();
        
        if (words.length < EXPECTED_WORD_COUNT) {
          console.log(`Cached trie is incomplete (${words.length}/${EXPECTED_WORD_COUNT} words), rebuilding...`);
          return false;
        }
        
        setWordCount(words.length);
        console.log('Trie loaded from cache with', words.length, 'words');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error loading cached trie:', err);
      return false;
    }
  }, [trie]);

  const fetchAndBuildTrie = useCallback(async () => {
    try {
      console.log('Building new trie from database...');
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      trie.clear();

      let processed = 0;
      const totalWords = words.length;
      let lastProgress = 0;
      
      for (const word of words) {
        const processedWord = processDigraphs(word.toUpperCase());
        trie.insert(processedWord, word);
        processed++;
        
        const currentProgress = Math.floor((processed / totalWords) * 100);
        if (currentProgress > lastProgress) {
          lastProgress = currentProgress;
          setLoadingProgress(currentProgress);
          console.log(`Building trie progress: ${currentProgress}% (${processed}/${totalWords} words)`);
        }
      }

      const trieWords = trie.getAllWords();
      if (trieWords.length < EXPECTED_WORD_COUNT) {
        throw new Error(`Trie build incomplete: got ${trieWords.length} words, expected ${EXPECTED_WORD_COUNT}`);
      }

      console.log('Saving trie to cache...');
      const serializedTrie = trie.serialize();
      await wordDB.saveTrie(serializedTrie);

      setWordCount(words.length);
      console.log('Trie built and cached successfully with', words.length, 'words');
    } catch (err) {
      console.error('Error building trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    }
  }, [trie]);

  useEffect(() => {
    const initTrie = async () => {
      try {
        const loadedFromCache = await buildTrie();
        if (!loadedFromCache) {
          await fetchAndBuildTrie();
        }
      } catch (err) {
        console.error('Error initializing trie:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    };

    initTrie();
  }, [buildTrie, fetchAndBuildTrie]);

  return { isLoading, error, wordCount, trie, loadingProgress };
};