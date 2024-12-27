import { useState, useEffect, useRef } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { toast } from 'sonner';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';

interface WordTrieState {
  isLoading: boolean;
  error: string | null;
  trie: typeof wordTrie;
  wordCount: number;
}

export const useWordTrie = (): WordTrieState => {
  const isInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const toastShownRef = useRef(false);
  const mountedRef = useRef(true);
  
  const [state, setState] = useState<WordTrieState>({
    isLoading: true,
    error: null,
    trie: wordTrie,
    wordCount: 0
  });

  useEffect(() => {
    mountedRef.current = true;

    const showReadyToast = (wordCount: number) => {
      if (!toastShownRef.current && mountedRef.current) {
        toast.success(`Lexicón listo: ${wordCount.toLocaleString()} palabras`, {
          duration: 3000,
          position: 'top-right',
        });
        toastShownRef.current = true;
      }
    };

    const initTrie = async () => {
      if (isInitializedRef.current) {
        const currentWords = Array.from(wordTrie.getAllWords());
        const testWord = 'FOWEAR';
        const processedTestWord = processDigraphs(testWord);
        const testAlphagram = generateAlphagram(processedTestWord);
        
        console.log('Checking Trie state:', {
          isInitialized: isInitializedRef.current,
          wordCount: currentWords.length,
          sampleWords: currentWords.slice(0, 5),
          hasFOWEAR: currentWords.includes(testWord),
          containsFOWEAR: wordTrie.search(testWord),
          containsProcessedFOWEAR: wordTrie.search(processedTestWord),
          testWordDetails: {
            original: testWord,
            processed: processedTestWord,
            alphagram: testAlphagram,
            length: processedTestWord.length
          }
        });
        
        if (currentWords.length === 0) {
          console.log('Trie is empty but marked as initialized, resetting...');
          isInitializedRef.current = false;
          toastShownRef.current = false;
          wordTrie.clear();
        } else {
          console.log('Trie is properly initialized with words:', currentWords.length);
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              wordCount: currentWords.length
            }));
            showReadyToast(currentWords.length);
          }
          return;
        }
      }

      if (initializationPromiseRef.current) {
        console.log('Waiting for existing initialization to complete...');
        await initializationPromiseRef.current;
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
        return;
      }

      initializationPromiseRef.current = (async () => {
        try {
          console.log('Starting fresh Trie initialization...');
          await wordDB.init();
          
          if (!mountedRef.current) return;
          
          const words = await wordDB.getAllWords();
          if (!mountedRef.current) return;

          if (words.length === 0) {
            throw new Error('No words found in IndexedDB');
          }

          wordTrie.clear();
          console.log('Building Trie with', words.length, 'words');
          console.log('Sample of first 10 words:', words.slice(0, 10));

          const startTime = performance.now();
          const batchSize = 10000;
          let processedCount = 0;

          for (let i = 0; i < words.length; i += batchSize) {
            if (!mountedRef.current) return;
            
            const batch = words.slice(i, i + batchSize);
            batch.forEach(word => {
              const upperWord = word.toUpperCase();
              const processedWord = processDigraphs(upperWord);
              const alphagram = generateAlphagram(processedWord);
              
              // Insert both the processed word and its alphagram
              wordTrie.insert(processedWord, upperWord);
              wordTrie.insert(alphagram, upperWord);
              processedCount++;
              
              // Debug specific words
              if (upperWord === 'FOWEAR') {
                console.log('Found FOWEAR during insertion:', {
                  original: word,
                  processed: processedWord,
                  alphagram,
                  length: processedWord.length,
                  isInTrie: wordTrie.search(processedWord),
                  alphagramInTrie: wordTrie.search(alphagram)
                });
              }
            });

            if (processedCount % 50000 === 0) {
              console.log('Words processed:', processedCount);
            }

            // Add small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          const endTime = performance.now();
          console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
          
          const trieWords = Array.from(wordTrie.getAllWords());
          const testWord = 'FOWEAR';
          const processedTestWord = processDigraphs(testWord);
          const testAlphagram = generateAlphagram(processedTestWord);
          
          console.log('Final Trie state:', {
            totalWords: trieWords.length,
            sampleWords: trieWords.slice(0, 5),
            testWordDetails: {
              original: testWord,
              processed: processedTestWord,
              alphagram: testAlphagram,
              length: processedTestWord.length,
              isInTrie: wordTrie.search(processedTestWord),
              alphagramInTrie: wordTrie.search(testAlphagram)
            }
          });

          if (mountedRef.current) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount: processedCount
            });
            
            isInitializedRef.current = true;
            showReadyToast(processedCount);
          }
        } catch (err) {
          console.error('Error initializing trie:', err);
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              error: err instanceof Error ? err.message : 'Unknown error',
              isLoading: false
            }));

            toast.error("No se pudo inicializar el lexicón", {
              duration: 4000,
              position: 'top-right',
            });
          }
        } finally {
          initializationPromiseRef.current = null;
        }
      })();

      await initializationPromiseRef.current;
    };

    initTrie();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
};