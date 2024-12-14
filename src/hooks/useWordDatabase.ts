import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initDB = async () => {
      try {
        // Initialize IndexedDB
        await wordDB.init();
        
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

        if (words) {
          await wordDB.addWords(words.map(w => w.word));
          toast({
            title: "Diccionario descargado",
            description: "Las palabras están disponibles offline.",
          });
        }
      } catch (err) {
        console.error('Error initializing word database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el diccionario.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, [toast]);

  return { isLoading, error };
};