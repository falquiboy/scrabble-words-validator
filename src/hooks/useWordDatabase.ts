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

    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
        if (!mounted) return;

        // Check if we already have words
        const existingWords = await wordDB.getAllWords();
        if (existingWords.length > 0) {
          setIsLoading(false);
          return;
        }

        // Fetch words from Supabase and store them
        const { data: words, error } = await supabase
          .from('words')
          .select('word');

        if (error) throw error;

        if (words && mounted) {
          await wordDB.addWords(words.map(w => w.word));
          toast({
            title: "Diccionario descargado",
            description: "Las palabras están disponibles offline.",
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