import { useState, useEffect, useRef } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { toast } from 'sonner';
import { processDigraphs, toDisplayFormat } from '@/utils/digraphs';

interface WordTrieState {
  isLoading: boolean;
  error: string | null;
  trie: typeof wordTrie;
  wordCount: number;
}

export const useWordTrie = (): WordTrieState => {
  const isInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  
  const [state, setState] = useState<WordTrieState>({
    isLoading: !isInitializedRef.current,
    error: null,
    trie: wordTrie,
    wordCount: 0
  });

  useEffect(() => {
    let mounted = true;

    const initTrie = async () => {
      // If already initialized and has words, return immediately
      if (isInitializedRef.current) {
        const currentWords = wordTrie.getAllWords();
        console.log('Checking Trie state:', {
          isInitialized: isInitializedRef.current,
          wordCount: currentWords.length
        });
        
        if (currentWords.length === 0) {
          console.log('Trie is empty but marked as initialized, resetting...');
          isInitializedRef.current = false;
          wordTrie.clear();
        } else {
          console.log('Trie is properly initialized with words:', currentWords.length);
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              wordCount: currentWords.length
            }));
          }
          return;
        }
      }

      // If initialization is in progress, wait for it
      if (initializationPromiseRef.current) {
        console.log('Waiting for existing initialization to complete...');
        await initializationPromiseRef.current;
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
        return;
      }

      // Start new initialization
      initializationPromiseRef.current = (async () => {
        try {
          console.log('Starting fresh Trie initialization...');
          await wordDB.init();
          
          const words = await wordDB.getAllWords();
          if (!mounted) return;

          if (words.length === 0) {
            throw new Error('No words found in IndexedDB');
          }

          // Clear trie before rebuilding
          wordTrie.clear();
          console.log('Building Trie with', words.length, 'words');

          const startTime = performance.now();
          const batchSize = 10000;
          let processedCount = 0;

          for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);
            batch.forEach(word => {
              // Store both processed and original forms
              const processedWord = processDigraphs(word.toUpperCase());
              wordTrie.insert(processedWord, word.toUpperCase());
              processedCount++;
            });

            if (processedCount % 50000 === 0) {
              console.log('Words processed:', processedCount);
            }

            // Allow other tasks to run
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          const endTime = performance.now();
          console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
          
          // Verify Trie contents
          const trieWords = wordTrie.getAllWords();
          console.log('Final Trie state:', {
            totalWords: trieWords.length,
            sampleWords: trieWords.slice(0, 5)
          });

          if (mounted) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount: processedCount
            });

            toast.success(`Diccionario listo: ${processedCount.toLocaleString()} palabras`, {
              duration: 3000,
              position: 'top-right',
            });
          }

          isInitializedRef.current = true;
        } catch (err) {
          console.error('Error initializing trie:', err);
          if (!mounted) return;
          
          setState(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Unknown error',
            isLoading: false
          }));

          toast.error("No se pudo inicializar el diccionario", {
            duration: 4000,
            position: 'top-right',
          });
        } finally {
          initializationPromiseRef.current = null;
        }
      })();

      await initializationPromiseRef.current;
    };

    initTrie();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
};