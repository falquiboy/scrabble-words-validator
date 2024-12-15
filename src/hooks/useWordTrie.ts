import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { useToast } from '@/hooks/use-toast';
import { processDigraphs } from '@/utils/digraphs';

interface WordTrieState {
  isLoading: boolean;
  error: string | null;
  trie: typeof wordTrie;
  wordCount: number;
}

export const useWordTrie = (): WordTrieState => {
  const [state, setState] = useState<WordTrieState>({
    isLoading: true,
    error: null,
    trie: wordTrie,
    wordCount: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initTrie = async () => {
      try {
        // Initialize database first
        await wordDB.init();
        
        // Try to load serialized trie
        const serializedTrie = await wordDB.getStoredTrie();
        
        if (!mounted) return;

        if (serializedTrie) {
          console.log('Loading pre-built Trie from storage...');
          const startTime = performance.now();
          
          // Deserialize and use stored trie
          wordTrie.deserialize(serializedTrie);
          const wordCount = wordTrie.getAllWords().length;
          
          const endTime = performance.now();
          console.log(`Trie loaded in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

          if (mounted) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount
            });

            toast({
              title: "Diccionario cargado",
              description: `${wordCount.toLocaleString()} palabras disponibles para búsqueda.`,
            });
          }
        } else {
          console.log('Building Trie for the first time...');
          // Get all words from IndexedDB
          const words = await wordDB.getAllWords();
          
          if (!mounted) return;

          if (words.length === 0) {
            throw new Error('No words found in IndexedDB');
          }

          // Clear trie before rebuilding
          wordTrie.clear();

          // Build trie with words
          const startTime = performance.now();
          
          // Build in batches to avoid blocking the main thread
          const batchSize = 10000;
          let processedCount = 0;

          for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);
            batch.forEach(word => {
              const processedWord = processDigraphs(word.toUpperCase());
              wordTrie.insert(processedWord, word);
              processedCount++;
            });
            
            if ((i + batchSize) % 50000 === 0) {
              console.log(`Built Trie with ${i + batchSize} words...`);
            }

            // Allow other tasks to run
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          const endTime = performance.now();
          console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

          // Store the built trie
          console.log('Storing built Trie...');
          const serialized = wordTrie.serialize();
          await wordDB.storeTrie(serialized);
          console.log('Trie stored successfully');

          if (mounted) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount: processedCount
            });

            toast({
              title: "Diccionario cargado",
              description: `${processedCount.toLocaleString()} palabras disponibles para búsqueda.`,
            });
          }
        }
      } catch (err) {
        console.error('Error initializing trie:', err);
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false
        }));

        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo inicializar el validador.",
        });
      }
    };

    initTrie();

    return () => {
      mounted = false;
    };
  }, [toast]);

  return state;
};