import { useState, useEffect } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { toast } from 'sonner';
import { processDigraphs } from '@/utils/digraphs';

interface WordTrieState {
  isLoading: boolean;
  error: string | null;
  trie: typeof wordTrie;
  wordCount: number;
}

// Global flag to track initialization
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export const useWordTrie = (): WordTrieState => {
  const [state, setState] = useState<WordTrieState>({
    isLoading: !isInitialized,
    error: null,
    trie: wordTrie,
    wordCount: 0
  });

  useEffect(() => {
    let mounted = true;

    const initTrie = async () => {
      // If already initialized, return immediately
      if (isInitialized) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
        return;
      }

      // If initialization is in progress, wait for it
      if (initializationPromise) {
        await initializationPromise;
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
        return;
      }

      // Start new initialization
      initializationPromise = (async () => {
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
          let processedCount = 0;

          for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);
            batch.forEach(word => {
              // Process the word for proper digraph handling
              const processedWord = processDigraphs(word.toUpperCase());
              wordTrie.insert(processedWord, word);
              processedCount++;
            });

            // Allow other tasks to run
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          const endTime = performance.now();
          console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
          
          // Verify Trie contents
          const trieWords = wordTrie.getAllWords();
          console.log('Total words in Trie:', trieWords.length);

          if (mounted) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount: processedCount
            });

            // Show the session notification using Sonner
            toast.success(`Diccionario listo: ${processedCount.toLocaleString()} palabras`, {
              duration: 3000,
              position: 'top-right',
            });
          }

          // Mark as initialized only after successful completion
          isInitialized = true;
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
          initializationPromise = null;
        }
      })();

      await initializationPromise;
    };

    initTrie();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
};