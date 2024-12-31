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

const initialState: WordTrieState = {
  isLoading: true,
  error: null,
  trie: wordTrie,
  wordCount: 0
};

export const useWordTrie = (): WordTrieState => {
  const [state, setState] = useState<WordTrieState>(initialState);
  const isInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const toastShownRef = useRef(false);
  const mountedRef = useRef(true);
  const uniqueWordsRef = useRef(new Set<string>());

  useEffect(() => {
    mountedRef.current = true;

    const showReadyToast = (wordCount: number) => {
      if (!toastShownRef.current && mountedRef.current) {
        toast.success(`${wordCount.toLocaleString()} palabras cargadas`, {
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
        const totalWordsInDB = await checkTotalWordsInDB();
        
        if (uniqueWordsRef.current.size === 0 || uniqueWordsRef.current.size < totalWordsInDB) {
          console.log('Trie needs rebuild:', {
            currentWords: uniqueWordsRef.current.size,
            expectedWords: totalWordsInDB
          });
          isInitializedRef.current = false;
          toastShownRef.current = false;
          wordTrie.clear();
          uniqueWordsRef.current.clear();
        } else {
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              wordCount: uniqueWordsRef.current.size
            }));
            showReadyToast(uniqueWordsRef.current.size);
          }
          return;
        }
      }

      if (initializationPromiseRef.current) {
        await initializationPromiseRef.current;
        return;
      }

      initializationPromiseRef.current = (async () => {
        try {
          await wordDB.init();
          
          if (!mountedRef.current) return;
          
          const words = await wordDB.getAllWords();
          const totalWordsInDB = await checkTotalWordsInDB();
          
          if (!mountedRef.current) return;

          if (words.length === 0 || words.length < totalWordsInDB) {
            throw new Error(`Incomplete word list: ${words.length}/${totalWordsInDB} words`);
          }

          wordTrie.clear();
          uniqueWordsRef.current.clear();
          
          const startTime = performance.now();
          const batchSize = 10000;
          let processedCount = 0;

          for (let i = 0; i < words.length; i += batchSize) {
            if (!mountedRef.current) return;
            
            const batch = words.slice(i, i + batchSize);
            batch.forEach(word => {
              const upperWord = word.toUpperCase();
              uniqueWordsRef.current.add(upperWord);
              const processedWord = processDigraphs(upperWord);
              const alphagram = generateAlphagram(processedWord);
              
              wordTrie.insert(processedWord, upperWord);
              wordTrie.insert(alphagram, upperWord);
              processedCount++;
            });

            if (processedCount % 50000 === 0) {
              console.log('Words processed:', processedCount);
            }

            await new Promise(resolve => setTimeout(resolve, 0));
          }

          const endTime = performance.now();
          console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

          if (uniqueWordsRef.current.size < totalWordsInDB) {
            throw new Error(`Failed to load all words: ${uniqueWordsRef.current.size}/${totalWordsInDB}`);
          }

          if (mountedRef.current) {
            setState({
              isLoading: false,
              error: null,
              trie: wordTrie,
              wordCount: uniqueWordsRef.current.size
            });
            
            isInitializedRef.current = true;
            showReadyToast(uniqueWordsRef.current.size);
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