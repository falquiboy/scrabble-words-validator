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
    let pageSize = 1000; // Fetch 1000 words at a time
    let lastId: string | null = null;

    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
        if (!mounted) return;

        // Check if we already have words
        const existingWords = await wordDB.getAllWords();
        if (existingWords.length > 0) {
          console.log('Words already in IndexedDB:', existingWords.length);
          setIsLoading(false);
          return;
        }

        // If no words exist, start fetching from Supabase
        let hasMore = true;
        let totalWords = 0;

        while (hasMore && mounted) {
          let query = supabase
            .from('words')
            .select('word')
            .order('word')
            .limit(pageSize);

          if (lastId) {
            query = query.gt('word', lastId);
          }

          const { data: words, error } = await query;

          if (error) throw error;
          if (!words || words.length === 0) {
            hasMore = false;
            continue;
          }

          if (mounted) {
            // Store this batch in IndexedDB
            await wordDB.addWords(words.map(w => w.word));
            totalWords += words.length;
            lastId = words[words.length - 1].word;

            // Update progress every 10,000 words
            if (totalWords % 10000 === 0) {
              console.log('Words loaded:', totalWords);
            }
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