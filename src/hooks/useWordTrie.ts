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

        if (words.length === 0) {
          throw new Error('No words found in IndexedDB');
        }

        // Clear trie before rebuilding
        wordTrie.clear();

        // Build trie with words
        console.log('Starting Trie build with', words.length, 'words');
        const startTime = performance.now();
        
        // Build in batches to avoid blocking the main thread
        const batchSize = 10000;
        for (let i = 0; i < words.length; i += batchSize) {
          const batch = words.slice(i, i + batchSize);
          batch.forEach(word => {
            wordTrie.insert(word, word);
          });
          
          // Log progress every 50k words
          if ((i + batchSize) % 50000 === 0) {
            console.log(`Built Trie with ${i + batchSize} words...`);
          }
        }

        const endTime = performance.now();
        console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
        
        // Verify Trie contents
        const trieWords = wordTrie.getAllWords();
        console.log('Total words in Trie:', trieWords.length);
        console.log('Sample of first 10 words:', words.slice(0, 10));
        console.log('First 10 words in Trie:', trieWords.slice(0, 10));
        
        // Verify some common words
        const testWords = ['CONTRATO', 'CASA', 'PERRO', 'AMOR', 'VIDA'];
        testWords.forEach(word => {
          const exists = wordTrie.search(word);
          console.log(`Is "${word}" in Trie?`, exists);
          if (!exists) {
            console.log(`Words starting with "${word}":`, Array.from(wordTrie.getWordsStartingWith(word)));
          }
        });

        if (trieWords.length !== words.length) {
          console.warn(`Mismatch in word count: IndexedDB has ${words.length} words, Trie has ${trieWords.length} words`);
        }

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