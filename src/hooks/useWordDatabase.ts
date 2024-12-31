import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        console.log('Current DB version:', currentVersion);

        // Get total count from Supabase
        const { count: totalWordsInSupabase } = await supabase
          .from('words')
          .select('*', { count: 'exact', head: true });

        console.log('Total words in Supabase:', totalWordsInSupabase);

        if (currentVersion < 3 || !totalWordsInSupabase) {
          console.log('Database needs rebuild. Clearing existing data...');
          await wordDB.clear();
          
          let lastWord = '';
          let totalWords = 0;
          let hasMore = true;

          while (hasMore && mounted && totalWords < totalWordsInSupabase) {
            try {
              console.log(`Fetching batch starting after word: "${lastWord}"`);
              
              const { data: words, error: fetchError } = await supabase
                .from('words')
                .select('word')
                .gt('word', lastWord)
                .order('word')
                .limit(BATCH_SIZE);

              if (fetchError) {
                console.error('Error fetching words:', fetchError);
                throw fetchError;
              }

              if (!words || words.length === 0) {
                console.log('No more words to fetch. Total words loaded:', totalWords);
                hasMore = false;
                break;
              }

              // Debug log for the first few words in each batch
              console.log('Sample of fetched words:', words.slice(0, 5).map(w => ({
                word: w.word,
                length: w.word.length,
                charCodes: Array.from(w.word).map(c => c.charCodeAt(0))
              })));

              if (mounted) {
                console.log(`Processing batch of ${words.length} words...`);
                
                // Log any suspicious two-letter words
                const shortWords = words.filter(w => w.word.length === 2);
                if (shortWords.length > 0) {
                  console.log('Two-letter words found in batch:', shortWords.map(w => ({
                    word: w.word,
                    charCodes: Array.from(w.word).map(c => c.charCodeAt(0))
                  })));
                }

                await wordDB.addWords(words.map(w => w.word));
                totalWords += words.length;
                lastWord = words[words.length - 1].word;
                
                const estimatedProgress = Math.min((totalWords / totalWordsInSupabase) * 100, 100);
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
              throw new Error(`Failed to process batch after ${MAX_RETRIES} retries`);
            }
          }

          if (mounted) {
            await wordDB.updateMetadata();
            console.log('Dictionary loaded successfully:', totalWords, 'words');
            toast.success(`Dictionary loaded: ${totalWords.toLocaleString()} words`);
          }
        } else {
          console.log('Database is up to date');
          const existingWords = await wordDB.getAllWords();
          console.log('Existing words in IndexedDB:', existingWords.length);
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