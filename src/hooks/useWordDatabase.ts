import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EXPECTED_WORD_COUNT = 639293;
const MAX_RETRIES = 5;
const BATCH_SIZE = 1000;
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

        let currentVersion = await wordDB.getVersion();
        console.log('Current DB version:', currentVersion);

        // Check if we have exactly the expected number of words
        const existingWords = await wordDB.getAllWords();
        console.log('Words in IndexedDB:', existingWords.length);

        if (currentVersion < 3 || existingWords.length !== EXPECTED_WORD_COUNT) {
          console.log('Database needs rebuild. Clearing existing data...');
          await wordDB.clear();
          
          let lastWord = '';
          let totalWords = 0;
          let hasMore = true;

          while (hasMore && mounted && totalWords < EXPECTED_WORD_COUNT) {
            try {
              console.log(`Fetching batch starting after word: "${lastWord}". Progress: ${totalWords}/${EXPECTED_WORD_COUNT}`);
              
              const { data: words, error: fetchError } = await supabase
                .from('words')
                .select('word')
                .gt('word', lastWord)
                .order('word')
                .limit(BATCH_SIZE);

              if (fetchError) {
                console.error('Supabase fetch error:', fetchError);
                throw new Error(`Failed to fetch words: ${fetchError.message}`);
              }

              if (!words || words.length === 0) {
                console.log('No more words to fetch. Total words loaded:', totalWords);
                if (totalWords < EXPECTED_WORD_COUNT) {
                  throw new Error(`Incomplete dictionary: loaded ${totalWords} of ${EXPECTED_WORD_COUNT} words`);
                }
                hasMore = false;
                break;
              }

              if (mounted) {
                console.log(`Processing batch of ${words.length} words...`);
                
                try {
                  await wordDB.addWords(words.map(w => w.word));
                } catch (dbError) {
                  console.error('IndexedDB error:', dbError);
                  throw new Error(`Failed to add words to IndexedDB: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
                }
                
                totalWords += words.length;
                lastWord = words[words.length - 1].word;
                
                const estimatedProgress = Math.min((totalWords / EXPECTED_WORD_COUNT) * 100, 100);
                setProgress(Math.floor(estimatedProgress));

                if (totalWords % 50000 === 0) {
                  console.log('Words loaded:', totalWords);
                  toast.info(`Loading dictionary: ${Math.floor(estimatedProgress)}%`);
                }
              }
            } catch (err) {
              console.error('Error in batch processing:', err);
              
              if (totalRetries < MAX_RETRIES) {
                totalRetries++;
                const backoffTime = Math.pow(BACKOFF_BASE, totalRetries) * 1000;
                console.log(`Retrying after word "${lastWord}" in ${backoffTime/1000}s... (${totalRetries}/${MAX_RETRIES})`);
                toast.error(`Error loading words. Retrying... (${totalRetries}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                continue;
              }
              
              const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
              throw new Error(`Failed to process batch after ${MAX_RETRIES} retries: ${errorMessage}`);
            }
          }

          if (mounted) {
            await wordDB.updateMetadata();
            console.log('Dictionary loaded successfully:', totalWords, 'words');
            toast.success(`Dictionary loaded: ${totalWords.toLocaleString()} words`);
          }
        } else {
          console.log('Database is up to date with', EXPECTED_WORD_COUNT, 'words');
          toast.success(`Dictionary ready: ${EXPECTED_WORD_COUNT.toLocaleString()} words`);
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