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

    const initDB = async () => {
      try {
        console.log('Initializing IndexedDB...');
        await wordDB.init();
        if (!mounted) return;

        const currentVersion = await wordDB.getVersion();
        const existingWords = await wordDB.getAllWords();
        console.log('Current DB version:', currentVersion);
        console.log('Existing words in IndexedDB:', existingWords.length);

        // Check if database needs rebuilding
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
              console.log('Checking Supabase connection...');
              
              // Test Supabase connection first
              const { data: testData, error: testError } = await supabase
                .from('words')
                .select('word')
                .limit(1);
                
              if (testError) {
                console.error('Supabase connection test failed:', testError);
                throw new Error(`Supabase connection failed: ${testError.message}`);
              }
              
              console.log('Supabase connection successful, fetching batch...');
              
              const { data: words, error: fetchError } = await supabase
                .rpc('get_words_batch', {
                  batch_size: BATCH_SIZE,
                  last_word: lastWord
                });

              if (fetchError) {
                console.error('Error fetching words:', fetchError);
                batchRetries++;
                
                if (batchRetries <= MAX_RETRIES) {
                  const backoffTime = Math.pow(BACKOFF_BASE, batchRetries) * 1000;
                  const message = `Error fetching words. Retrying in ${backoffTime/1000}s... (${batchRetries}/${MAX_RETRIES})`;
                  console.log(message);
                  toast.error(message);
                  await new Promise(resolve => setTimeout(resolve, backoffTime));
                  continue;
                }
                
                throw new Error(`Failed to fetch batch after ${MAX_RETRIES} retries: ${fetchError.message}`);
              }

              if (!words || words.length === 0) {
                console.log('No words returned in batch. Total words so far:', totalWords);
                if (totalWords < MINIMUM_EXPECTED_WORDS) {
                  if (totalRetries < MAX_RETRIES) {
                    totalRetries++;
                    lastWord = null;
                    totalWords = 0;
                    const backoffTime = Math.pow(BACKOFF_BASE, totalRetries) * 1000;
                    const message = `Incomplete word list. Restarting in ${backoffTime/1000}s... (${totalRetries}/${MAX_RETRIES})`;
                    console.log(message);
                    toast.error(message);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                    continue;
                  }
                  throw new Error(`Failed to fetch minimum required words. Got ${totalWords}, expected ${MINIMUM_EXPECTED_WORDS}`);
                }
                hasMore = false;
                continue;
              }

              if (mounted) {
                console.log(`Processing batch of ${words.length} words...`);
                await wordDB.addWords(words.map(w => w.word));
                totalWords += words.length;
                lastWord = words[words.length - 1].word;
                
                // Update progress
                const estimatedProgress = Math.min((totalWords / MINIMUM_EXPECTED_WORDS) * 100, 100);
                setProgress(Math.floor(estimatedProgress));

                if (totalWords % 50000 === 0) {
                  console.log('Words loaded:', totalWords);
                  toast.info(`Loading dictionary: ${Math.floor(estimatedProgress)}%`);
                }
              }

              // Reset batch retries on successful fetch
              batchRetries = 0;
            } catch (err) {
              console.error('Error in batch processing:', err);
              if (batchRetries < MAX_RETRIES) {
                batchRetries++;
                const backoffTime = Math.pow(BACKOFF_BASE, batchRetries) * 1000;
                const message = `Error processing batch. Retrying in ${backoffTime/1000}s... (${batchRetries}/${MAX_RETRIES})`;
                console.log(message);
                toast.error(message);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                continue;
              }
              throw err;
            }
          }

          if (mounted) {
            if (totalWords >= MINIMUM_EXPECTED_WORDS) {
              await wordDB.updateMetadata();
              console.log('Total words loaded:', totalWords);
              toast.success(`Dictionary loaded successfully: ${totalWords.toLocaleString()} words`);
            } else {
              throw new Error(`Failed to fetch minimum required words. Got ${totalWords}, expected ${MINIMUM_EXPECTED_WORDS}`);
            }
          }
        } else {
          console.log('Database is up to date');
          toast.success(`Dictionary ready: ${existingWords.length.toLocaleString()} words`);
        }
      } catch (err) {
        console.error('Error initializing word database:', err);
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error initializing dictionary';
        setError(errorMessage);
        toast.error(errorMessage);
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