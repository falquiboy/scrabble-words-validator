import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_RETRIES = 5;
const BATCH_SIZE = 1000;
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
        console.log('Current DB version:', currentVersion);

        // Always fetch from Supabase first to get the total count
        const { count: totalWordsInSupabase } = await supabase
          .from('words')
          .select('*', { count: 'exact', head: true });

        console.log('Total words in Supabase:', totalWordsInSupabase);

        if (currentVersion < 3 || !totalWordsInSupabase) {
          console.log('Database needs rebuild. Clearing existing data...');
          await wordDB.clear();
          
          let offset = 0;
          let totalWords = 0;
          let hasMore = true;

          while (hasMore && mounted) {
            try {
              console.log(`Fetching batch starting from offset: ${offset}`);
              
              const { data: words, error: fetchError } = await supabase
                .from('words')
                .select('word')
                .range(offset, offset + BATCH_SIZE - 1)
                .order('word');

              if (fetchError) {
                console.error('Error fetching words:', fetchError);
                throw fetchError;
              }

              if (!words) {
                console.error('No data returned from batch fetch');
                throw new Error('No data returned from batch fetch');
              }

              if (words.length === 0) {
                console.log('No more words to fetch. Total words loaded:', totalWords);
                hasMore = false;
                continue;
              }

              if (mounted) {
                console.log(`Processing batch of ${words.length} words...`);
                await wordDB.addWords(words.map(w => w.word));
                totalWords += words.length;
                offset += words.length;
                
                const estimatedProgress = Math.min((totalWords / MINIMUM_EXPECTED_WORDS) * 100, 100);
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
                console.log(`Retrying from offset ${offset} in ${backoffTime/1000}s... (${totalRetries}/${MAX_RETRIES})`);
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