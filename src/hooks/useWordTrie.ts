import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { fetchAllWords } from '@/utils/wordFetcher';
import { buildTrieFromWords, loadCachedTrie, saveTrie } from '@/utils/trieOperations';

const EXPECTED_WORD_COUNT = 639293;

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchWordsFromDB = async () => {
    try {
      let words = await wordDB.getAllWords();
      console.log('Words in local database:', words.length);

      if (words.length < EXPECTED_WORD_COUNT) {
        console.log('Local DB incomplete, fetching from Supabase...');
        words = await fetchAllWords(EXPECTED_WORD_COUNT, setLoadingProgress);
        
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
      
      if (cachedWordCount >= EXPECTED_WORD_COUNT) {
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

  const fetchAndBuildTrie = useCallback(async () => {
    try {
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      await buildTrieFromWords(words, trie, setLoadingProgress);
      await saveTrie(trie);

      setWordCount(words.length);
      console.log('Trie built and cached successfully with', words.length, 'words');
    } catch (err) {
      console.error('Error building trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    }
  }, [trie]);

  useEffect(() => {
    const initTrie = async () => {
      try {
        const loadedFromCache = await buildTrie();
        if (!loadedFromCache) {
          await fetchAndBuildTrie();
        }
      } catch (err) {
        console.error('Error initializing trie:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    };

    initTrie();
  }, [buildTrie, fetchAndBuildTrie]);

  return { isLoading, error, wordCount, trie, loadingProgress };
};