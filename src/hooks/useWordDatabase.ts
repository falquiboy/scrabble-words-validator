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

    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
        if (!mounted) return;

        // Check if we already have words
        const existingWords = await wordDB.getAllWords();
        console.log('Checking existing words in IndexedDB:', existingWords.length);
        
        // Only proceed with loading if we have less than 100,000 words
        // This is a safety check since we expect around 640,000 words
        if (existingWords.length > 100000) {
          console.log('Words already in IndexedDB:', existingWords.length);
          setIsLoading(false);
          return;
        }

        // If insufficient words exist, start fetching from Supabase
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
              // Store this batch in IndexedDB
              await wordDB.addWords(words.map(w => w.word));
              totalWords += words.length;
              lastWord = words[words.length - 1].word;

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
            if (retryCount < maxRetries) {
              retryCount++;
              continue;
            }
            throw err;
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