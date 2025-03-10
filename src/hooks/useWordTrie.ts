
import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { buildTrieFromWords, loadCachedTrie, saveTrie } from '@/utils/trieOperations';
import { LoadingStage } from './useWordDatabase';

// Known total word count from the database
const TOTAL_WORDS = 639293;

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stage, setStage] = useState<LoadingStage>('initializing');

  const loadWordsFromCsv = async () => {
    try {
      setStage('download');
      const csvLoader = new CsvWordLoader(TOTAL_WORDS);
      const success = await csvLoader.loadCsvFile();
      
      if (success) {
        console.log('Words loaded from CSV successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading words from CSV:', error);
      return false;
    }
  };

  const fetchWordsFromDB = async () => {
    try {
      let words = await wordDB.getAllWords();
      console.log('Words in local database:', words.length);

      if (words.length === 0 || words.length < TOTAL_WORDS) {
        console.log('Local DB empty or incomplete, loading from CSV...');
        const csvSuccess = await loadWordsFromCsv();
        
        if (!csvSuccess) {
          setStage('processing');
          toast.error('Error al cargar el diccionario, por favor intente más tarde');
        }
        
        // Get words from database again after CSV load
        words = await wordDB.getAllWords();
      }
      
      return words;
    } catch (error) {
      console.error('Error fetching words:', error);
      throw error;
    }
  };

  const buildTrie = useCallback(async () => {
    try {
      const cachedWordCount = await loadCachedTrie(trie);
      
      if (cachedWordCount > 0 && cachedWordCount >= TOTAL_WORDS) {
        setWordCount(cachedWordCount);
        console.log('Trie loaded from cache with', cachedWordCount, 'words');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error loading cached trie:', err);
      return false;
    }
  }, [trie]);

  const buildTrieFromLocalDb = useCallback(async () => {
    try {
      setStage('building');
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      await buildTrieFromWords(words, trie, (progress) => {
        setLoadingProgress(progress);
      });
      await saveTrie(trie);

      setWordCount(words.length);
      setStage('complete');
      console.log('Trie built and cached successfully with', words.length, 'words');
    } catch (err) {
      console.error('Error building trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al inicializar el diccionario';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    }
  }, [trie]);

  useEffect(() => {
    const initTrie = async () => {
      try {
        const loadedFromCache = await buildTrie();
        if (!loadedFromCache) {
          await buildTrieFromLocalDb();
        } else {
          setStage('complete');
        }
      } catch (err) {
        console.error('Error initializing trie:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al inicializar el diccionario';
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    };

    initTrie();
  }, [buildTrie, buildTrieFromLocalDb]);

  return { 
    isLoading, 
    error, 
    wordCount, 
    trie, 
    loadingProgress, 
    stage 
  };
};

// Import and re-export CsvWordLoader to make TypeScript happy
import { CsvWordLoader } from '@/services/CsvWordLoader';
export { CsvWordLoader };
