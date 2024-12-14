import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { useToast } from '@/hooks/use-toast';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initTrie = async () => {
      try {
        // Initialize database first
        await wordDB.init();
        
        // Get processed words from IndexedDB
        const words = await wordDB.getProcessedWords();
        
        if (!mounted) return;

        // Build trie with both processed and original words
        words.forEach(({ original, processed }) => {
          wordTrie.insert(processed, original);
        });

        console.log('Trie built with', words.length, 'words');
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing trie:', err);
        if (!mounted) return;
        
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo inicializar el validador.",
        });
        setIsLoading(false);
      }
    };

    initTrie();

    return () => {
      mounted = false;
    };
  }, [toast]);

  return { isLoading, error };
};