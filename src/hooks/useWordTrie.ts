
import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { fetchAllWords } from '@/utils/wordFetcher';
import { buildTrieFromWords, loadCachedTrie, saveTrie } from '@/utils/trieOperations';

// Known total word count from the database
const TOTAL_WORDS = 639293;
const PROGRESS_KEY = 'dictionary_progress';

interface ProgressState {
  currentWords: number;
  lastUpdated: number;
  downloadSpeed?: number;
  estimatedTimeRemaining?: number;
}

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
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
      const timeDiff = (now - lastProgress.lastUpdated) / 1000; // seconds
      const wordDiff = currentWords - lastProgress.currentWords;
      if (timeDiff > 0) {
        const speed = (wordDiff * 10) / timeDiff; // Approx 10 bytes per word
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
        
        // Clear and rebuild local DB
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
      const cachedWordCount = await loadCachedTrie(trie);
      
      if (cachedWordCount > 0 && cachedWordCount >= TOTAL_WORDS) {
        setWordCount(cachedWordCount);
        updateProgress(cachedWordCount);
        console.log('Trie loaded from cache with', cachedWordCount, 'words');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error loading cached trie:', err);
      return false;
    }
  }, [trie, updateProgress]);

  const fetchAndBuildTrie = useCallback(async () => {
    if (isPaused) return;
    
    try {
      setIsLoading(true);
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      await buildTrieFromWords(words, trie, (progress) => {
        setLoadingProgress(Math.round((progress + loadingProgress) / 2));
      });
      await saveTrie(trie);

      setWordCount(words.length);
      if (words.length >= TOTAL_WORDS) {
        clearProgress();
      }
      console.log('Trie built and cached successfully with', words.length, 'words');
    } catch (err) {
      console.error('Error building trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [trie, isPaused, loadingProgress, clearProgress]);

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
    trie, 
    loadingProgress,
    downloadSpeed,
    estimatedTimeRemaining,
    isPaused,
    pauseDownload,
    resumeDownload,
    totalWords: TOTAL_WORDS
  };
};
