import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let batchSize = 10000;
    let maxRetries = 3;

    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
        if (!mounted) return;

        // Check if we already have words
        const existingWords = await wordDB.getAllWords();
        console.log('Checking existing words in IndexedDB:', existingWords.length);
        
        // Only proceed with loading if we have less than 600,000 words
        // This is a safety check since we expect around 640,000 words
        if (existingWords.length >= 639000) {
          console.log('Full dictionary already in IndexedDB:', existingWords.length);
          setIsLoading(false);
          return;
        }

        // Clear existing words if we have an incomplete dictionary
        if (existingWords.length > 0 && existingWords.length < 639000) {
          console.log('Clearing incomplete dictionary...');
          await wordDB.clear();
        }

        // If insufficient words exist, start fetching from Supabase
        let hasMore = true;
        let totalWords = 0;
        let lastWord: string | null = null;

        const fetchBatchWithRetry = async (retryCount = 0): Promise<string[]> => {
          try {
            console.log('Fetching batch starting after word:', lastWord);
            const { data: words, error: fetchError } = await supabase
              .rpc('get_words_batch', {
                batch_size: batchSize,
                last_word: lastWord
              });

            if (fetchError) throw fetchError;
            if (!words) return [];
            
            return words.map(w => w.word);
          } catch (error) {
            console.error(`Batch fetch error (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < maxRetries) {
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchBatchWithRetry(retryCount + 1);
            }
            throw error;
          }
        };

        while (hasMore && mounted) {
          try {
            const words = await fetchBatchWithRetry();
            
            if (!words || words.length === 0) {
              console.log('No more words to fetch');
              hasMore = false;
              continue;
            }

            console.log(`Fetched ${words.length} words in this batch`);

            if (mounted) {
              // Store this batch in IndexedDB
              await wordDB.addWords(words);
              totalWords += words.length;
              lastWord = words[words.length - 1];

              // Update progress every 50,000 words
              if (totalWords % 50000 === 0) {
                console.log('Words loaded:', totalWords);
                // Show a toast every 100k words
                if (totalWords % 100000 === 0) {
                  toast({
                    title: "Cargando diccionario...",
                    description: `${totalWords.toLocaleString()} palabras cargadas.`,
                  });
                }
              }
            }
          } catch (err) {
            console.error('Error in batch processing:', err);
            // If we've loaded some words, we can continue from the last successful point
            if (totalWords > 0) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Error al cargar algunas palabras. Reintentando...",
              });
              continue;
            }
            throw err;
          }
        }

        // Verify final word count
        const finalWordCount = await wordDB.getAllWords();
        console.log('Final word count in IndexedDB:', finalWordCount.length);
        
        if (finalWordCount.length < 639000) {
          console.error('Dictionary incomplete, retrying initialization...');
          if (mounted) {
            await wordDB.clear();
            await initDB();
            return;
          }
        }

        if (mounted) {
          console.log('Total words loaded:', totalWords);
          toast({
            title: "Diccionario descargado",
            description: `${totalWords.toLocaleString()} palabras disponibles offline.`,
          });
        }
      } catch (err) {
        console.error('Error initializing word database:', err);
        if (!mounted) return;
        
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el diccionario.",
        });
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
  }, [toast]);

  return { isLoading, error };
};