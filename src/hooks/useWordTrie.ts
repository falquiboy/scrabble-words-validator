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
        
        // Get all words from IndexedDB
        const words = await wordDB.getAllWords();
        
        if (!mounted) return;

        // Clear trie before rebuilding
        wordTrie.clear();

        // Build trie with words
        words.forEach(word => {
          wordTrie.insert(word, word);
        });

        // Debug logging
        console.log('Trie built with', words.length, 'words');
        console.log('Sample of first 10 words:', words.slice(0, 10));
        
        // Log all words in Trie for verification
        const trieWords = wordTrie.getAllWords();
        console.log('First 10 words in Trie:', trieWords.slice(0, 10));
        console.log('Total words in Trie:', trieWords.length);
        
        // Specific word check
        const testWords = ['CONTRATO', 'CASA', 'PERRO'];
        testWords.forEach(word => {
          console.log(`Is "${word}" in Trie?`, wordTrie.search(word));
          console.log(`Words starting with "${word}":`, Array.from(wordTrie.getWordsStartingWith(word)));
        });

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