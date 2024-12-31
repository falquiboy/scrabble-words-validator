import { useState, useEffect, useRef } from 'react';
import { wordDB } from '@/utils/wordDatabase';
import { wordTrie } from '@/utils/trie';
import { toast } from 'sonner';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';
import { supabase } from '@/integrations/supabase/client';

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

    const checkTotalWordsInDB = async () => {
      const { count, error } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error checking total words:', error);
        throw error;
      }
      
      return count || 0;
    };

    const initTrie = async () => {
      if (isInitializedRef.current) {
        const currentWords = Array.from(wordTrie.getAllWords());
        const totalWordsInDB = await checkTotalWordsInDB();
        
        console.log('Checking Trie state:', {
          isInitialized: isInitializedRef.current,
          wordCount: currentWords.length,
          totalWordsInDB,
          sampleWords: currentWords.slice(0, 5)
        });
        
        // Reset if Trie is empty or doesn't have all words
        if (currentWords.length === 0 || currentWords.length < totalWordsInDB) {
          console.log('Trie needs rebuild:', {
            currentWords: currentWords.length,
            expectedWords: totalWordsInDB
          });
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
          const totalWordsInDB = await checkTotalWordsInDB();
          
          if (!mountedRef.current) return;

          if (words.length === 0 || words.length < totalWordsInDB) {
            throw new Error(`Incomplete word list: ${words.length}/${totalWordsInDB} words`);
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
          
          console.log('Final Trie state:', {
            totalWords: trieWords.length,
            expectedWords: totalWordsInDB,
            sampleWords: trieWords.slice(0, 5)
          });

          if (trieWords.length < totalWordsInDB) {
            throw new Error(`Failed to load all words: ${trieWords.length}/${totalWordsInDB}`);
          }

          if (mountedRef.current) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount: trieWords.length
            });
            
            isInitializedRef.current = true;
            showReadyToast(trieWords.length);
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