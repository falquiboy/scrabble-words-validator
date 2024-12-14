import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { useToast } from '@/components/ui/use-toast';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initTrie = async () => {
      try {
        // Get processed words from IndexedDB
        const words = await wordDB.getProcessedWords();
        
        // Build trie with both processed and original words
        words.forEach(({ original, processed }) => {
          wordTrie.insert(processed, original);
        });

        console.log('Trie built with', words.length, 'words');
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing trie:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo inicializar el validador.",
        });
      }
    };

    initTrie();
  }, [toast]);

  return { isLoading, error };
};