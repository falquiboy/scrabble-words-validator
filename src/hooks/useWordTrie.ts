
import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { fetchAllWords } from '@/utils/wordFetcher';
import { buildTrieFromWords, loadCachedTrie, saveTrie } from '@/utils/trieOperations';
import { TOTAL_WORDS, PROGRESS_KEY } from '@/utils/dictionaryConstants';
import { trieCache } from '@/services/TrieCache';

interface ProgressState {
  currentWords: number;
  lastUpdated: number;
  downloadSpeed?: number;
  estimatedTimeRemaining?: number;
}

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie, setTrie] = useState<Trie | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number>();
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>();
  const [isPaused, setIsPaused] = useState(false);

  const saveProgress = useCallback((progress: ProgressState) => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, []);

  const loadProgress = useCallback((): ProgressState | null => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(PROGRESS_KEY);
  }, []);

  const updateProgress = useCallback((currentWords: number) => {
    const now = Date.now();
    const lastProgress = loadProgress();
    
    if (lastProgress) {
      const timeDiff = (now - lastProgress.lastUpdated) / 1000;
      const wordDiff = currentWords - lastProgress.currentWords;
      if (timeDiff > 0) {
        const speed = (wordDiff * 10) / timeDiff;
        const remainingWords = TOTAL_WORDS - currentWords;
        const timeRemaining = remainingWords * 10 / speed;
        
        setDownloadSpeed(speed);
        setEstimatedTimeRemaining(timeRemaining);
      }
    }

    saveProgress({
      currentWords,
      lastUpdated: now,
      downloadSpeed: downloadSpeed,
      estimatedTimeRemaining: estimatedTimeRemaining
    });

    const progress = Math.round((currentWords / TOTAL_WORDS) * 100);
    setLoadingProgress(progress);
    setWordCount(currentWords);
  }, [downloadSpeed, estimatedTimeRemaining, loadProgress, saveProgress]);

  const fetchWordsFromDB = async () => {
    try {
      let words = await wordDB.getAllWords();
      console.log('Words in local database:', words.length);

      if (words.length === 0 || words.length < TOTAL_WORDS) {
        console.log('Local DB empty or incomplete, fetching from Supabase...');
        words = await fetchAllWords(TOTAL_WORDS, updateProgress);
        
        await wordDB.clear();
        await wordDB.addWords(words);
        console.log('Words stored in local DB:', words.length);
      }
      
      return words;
    } catch (error) {
      console.error('Error fetching words:', error);
      throw error;
    }
  };

  const buildTrie = useCallback(async () => {
    try {
      const serializedTrie = await wordDB.loadTrie();
      if (serializedTrie) {
        trieCache.setSerializedTrie(serializedTrie);
        const trie = await trieCache.getTrie();
        const wordCount = trie.getAllWords().length;
        
        if (wordCount >= TOTAL_WORDS) {
          setTrie(trie);
          setWordCount(wordCount);
          updateProgress(wordCount);
          console.log('Trie loaded from cache with', wordCount, 'words');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error loading cached trie:', err);
      return false;
    }
  }, [updateProgress]);

  const fetchAndBuildTrie = useCallback(async () => {
    if (isPaused) return;
    
    try {
      setIsLoading(true);
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      const newTrie = new Trie();
      await buildTrieFromWords(words, newTrie, (progress) => {
        setLoadingProgress(Math.round((progress + loadingProgress) / 2));
      });
      
      const serializedTrie = newTrie.serialize();
      await saveTrie(newTrie);
      trieCache.setSerializedTrie(serializedTrie);
      
      setTrie(newTrie);
      setWordCount(words.length);
      if (words.length >= TOTAL_WORDS) {
        clearProgress();
      }
    } catch (err) {
      console.error('Error building trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clearProgress, isPaused, loadingProgress]);

  const pauseDownload = useCallback(() => {
    setIsPaused(true);
    setIsLoading(false);
  }, []);

  const resumeDownload = useCallback(() => {
    setIsPaused(false);
    fetchAndBuildTrie();
  }, [fetchAndBuildTrie]);

  useEffect(() => {
    const initTrie = async () => {
      try {
        const loadedFromCache = await buildTrie();
        if (!loadedFromCache && !isPaused) {
          await fetchAndBuildTrie();
        }
      } catch (err) {
        console.error('Error initializing trie:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        if (!isPaused) {
          setIsLoading(false);
          setLoadingProgress(100);
        }
      }
    };

    initTrie();
  }, [buildTrie, fetchAndBuildTrie, isPaused]);

  return {
    isLoading,
    error,
    wordCount,
    trie: trie as Trie, // Type assertion since we know it will be initialized
    loadingProgress,
    downloadSpeed,
    estimatedTimeRemaining,
    isPaused,
    pauseDownload,
    resumeDownload,
    totalWords: TOTAL_WORDS
  };
};
