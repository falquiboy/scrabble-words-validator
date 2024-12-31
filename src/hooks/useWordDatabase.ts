import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_RETRIES = 5;
const BATCH_SIZE = 5000;
const MINIMUM_EXPECTED_WORDS = 600000;
const BACKOFF_BASE = 2;

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let totalRetries = 0;

    const checkSupabaseConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
          .from('words')
          .select('word')
          .limit(1)
          .throwOnError();
        
        if (error) {
          console.error('Supabase connection test failed:', error);
          throw new Error(`Database connection failed: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          throw new Error('Database connection test returned no data');
        }
        
        console.log('Supabase connection test successful');
        return true;
      } catch (err) {
        console.error('Connection test error:', err);
        const message = err instanceof Error ? err.message : 'Failed to connect to database';
        toast.error(message);
        throw err;
      }
    };

    const initDB = async () => {
      try {
        await checkSupabaseConnection();
        
        console.log('Initializing IndexedDB...');
        await wordDB.init();
        if (!mounted) return;

        const currentVersion = await wordDB.getVersion();
        const existingWords = await wordDB.getAllWords();
        console.log('Current DB version:', currentVersion);
        console.log('Existing words in IndexedDB:', existingWords.length);

        if (currentVersion < 3 || existingWords.length < MINIMUM_EXPECTED_WORDS) {
          console.log('Database needs rebuild. Clearing existing data...');
          await wordDB.clear();
          
          let hasMore = true;
          let totalWords = 0;
          let lastWord: string | null = null;
          let batchRetries = 0;

          while (hasMore && mounted) {
            try {
              console.log('Fetching batch starting after word:', lastWord);
              
              const { data: words, error: fetchError } = await supabase
                .rpc('get_words_batch', {
                  batch_size: BATCH_SIZE,
                  last_word: lastWord || null
                });

              if (fetchError) {
                console.error('Error fetching words:', fetchError);
                throw fetchError;
              }

              if (!words) {
                console.error('No data returned from batch fetch');
                throw new Error('No data returned from batch fetch');
              }

              if (words.length === 0) {
                console.log('No words returned in batch. Total words so far:', totalWords);
                if (totalWords < MINIMUM_EXPECTED_WORDS) {
                  if (totalRetries < MAX_RETRIES) {
                    totalRetries++;
                    lastWord = null;
                    totalWords = 0;
                    const backoffTime = Math.pow(BACKOFF_BASE, totalRetries) * 1000;
                    console.log(`Retrying from start in ${backoffTime/1000}s... (${totalRetries}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                    continue;
                  }
                  throw new Error(`Failed to fetch minimum required words (${totalWords}/${MINIMUM_EXPECTED_WORDS})`);
                }
                hasMore = false;
                continue;
              }

              if (mounted) {
                console.log(`Processing batch of ${words.length} words...`);
                await wordDB.addWords(words.map(w => w.word));
                totalWords += words.length;
                lastWord = words[words.length - 1].word;
                
                const estimatedProgress = Math.min((totalWords / MINIMUM_EXPECTED_WORDS) * 100, 100);
                setProgress(Math.floor(estimatedProgress));

                if (totalWords % 50000 === 0) {
                  console.log('Words loaded:', totalWords);
                  toast.info(`Loading dictionary: ${Math.floor(estimatedProgress)}%`);
                }
              }

              batchRetries = 0;
            } catch (err) {
              console.error('Error in batch processing:', err);
              const errorMessage = err instanceof Error ? err.message : 'Unknown batch processing error';
              console.log('Detailed error:', errorMessage);
              
              if (batchRetries < MAX_RETRIES) {
                batchRetries++;
                const backoffTime = Math.pow(BACKOFF_BASE, batchRetries) * 1000;
                console.log(`Retrying batch in ${backoffTime/1000}s... (${batchRetries}/${MAX_RETRIES})`);
                toast.error(`Error loading words. Retrying... (${batchRetries}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                continue;
              }
              throw new Error(`Failed to process batch after ${MAX_RETRIES} retries: ${errorMessage}`);
            }
          }

          if (mounted) {
            if (totalWords >= MINIMUM_EXPECTED_WORDS) {
              await wordDB.updateMetadata();
              console.log('Dictionary loaded successfully:', totalWords, 'words');
              toast.success(`Dictionary loaded: ${totalWords.toLocaleString()} words`);
            } else {
              throw new Error(`Failed to fetch minimum required words (${totalWords}/${MINIMUM_EXPECTED_WORDS})`);
            }
          }
        } else {
          console.log('Database is up to date');
          toast.success(`Dictionary ready: ${existingWords.length.toLocaleString()} words`);
        }
      } catch (err) {
        console.error('Error initializing word database:', err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to initialize dictionary';
          setError(message);
          toast.error(message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initDB();

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoading, error, progress };
};