import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let batchSize = 10000;

    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
        if (!mounted) return;

        // Check current version
        const currentVersion = await wordDB.getVersion();
        const existingWords = await wordDB.getAllWords();
        console.log('Current DB version:', currentVersion);
        console.log('Existing words in IndexedDB:', existingWords.length);
        
        // If version is old or we have insufficient words, rebuild the database
        if (currentVersion < 3 || existingWords.length < 100000) {
          console.log('Database needs rebuild. Clearing existing data...');
          await wordDB.clear();
          
          // Start fetching from Supabase
          let hasMore = true;
          let totalWords = 0;
          let lastWord: string | null = null;
          let retryCount = 0;
          const maxRetries = 3;

          while (hasMore && mounted) {
            try {
              console.log('Fetching batch starting after word:', lastWord);
              const { data: words, error: fetchError } = await supabase
                .rpc('get_words_batch', {
                  batch_size: batchSize,
                  last_word: lastWord
                });

              if (fetchError) {
                console.error('Error fetching words:', fetchError);
                if (retryCount < maxRetries) {
                  retryCount++;
                  continue;
                }
                throw fetchError;
              }

              if (!words || words.length === 0) {
                console.log('No more words to fetch');
                hasMore = false;
                continue;
              }

              console.log(`Fetched ${words.length} words in this batch`);

              if (mounted) {
                await wordDB.addWords(words.map(w => w.word));
                totalWords += words.length;
                lastWord = words[words.length - 1].word;

                if (totalWords % 50000 === 0) {
                  console.log('Words loaded:', totalWords);
                }
              }
            } catch (err) {
              console.error('Error in batch processing:', err);
              if (retryCount < maxRetries) {
                retryCount++;
                continue;
              }
              throw err;
            }
          }

          if (mounted) {
            await wordDB.updateMetadata();
            console.log('Total words loaded:', totalWords);
          }
        } else {
          console.log('Database is up to date');
        }
      } catch (err) {
        console.error('Error initializing word database:', err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
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

  return { isLoading, error };
};