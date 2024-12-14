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
    let pageSize = 10000; // Increased page size for better performance
    let lastId: string | null = null;

    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
        if (!mounted) return;

        // Check if we already have words
        const existingWords = await wordDB.getAllWords();
        console.log('Checking existing words in IndexedDB:', existingWords.length);
        
        if (existingWords.length > 0) {
          console.log('Words already in IndexedDB:', existingWords.length);
          setIsLoading(false);
          return;
        }

        // If no words exist, start fetching from Supabase
        let hasMore = true;
        let totalWords = 0;
        let retryCount = 0;
        const maxRetries = 3;

        while (hasMore && mounted) {
          try {
            let query = supabase
              .from('words')
              .select('word')
              .order('word')
              .limit(pageSize);

            if (lastId) {
              query = query.gt('word', lastId);
            }

            const { data: words, error: fetchError } = await query;

            if (fetchError) {
              console.error('Error fetching words:', fetchError);
              if (retryCount < maxRetries) {
                retryCount++;
                continue;
              }
              throw fetchError;
            }

            if (!words || words.length === 0) {
              hasMore = false;
              continue;
            }

            if (mounted) {
              // Store this batch in IndexedDB
              const wordsToStore = words.map(w => w.word);
              await wordDB.addWords(wordsToStore);
              totalWords += words.length;
              lastId = words[words.length - 1].word;

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