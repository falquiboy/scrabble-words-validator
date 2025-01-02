import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { processDigraphs } from '@/utils/digraphs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchWordsFromDB = async () => {
    // First try to get words from IndexedDB
    let words = await wordDB.getAllWords();
    console.log('Words in local database:', words.length);

    // If local DB is empty, fetch from Supabase
    if (words.length === 0) {
      console.log('Local DB empty, fetching from Supabase...');
      const { data, error } = await supabase
        .from('words')
        .select('word');
      
      if (error) throw new Error(`Failed to fetch words: ${error.message}`);
      if (!data) throw new Error('No words returned from database');
      
      words = data.map(w => w.word.toUpperCase());
      
      // Store words in local DB for future use
      await wordDB.addWords(words);
      console.log('Words stored in local DB:', words.length);
    }
    
    return words;
  };

  const buildTrie = useCallback(async () => {
    try {
      console.log('Checking for serialized trie...');
      const serializedTrie = await wordDB.loadTrie();
      
      if (serializedTrie) {
        console.log('Found serialized trie, deserializing...');
        setLoadingProgress(50);
        trie.deserialize(serializedTrie);
        const words = trie.getAllWords();
        setWordCount(words.length);
        console.log('Trie loaded from cache with', words.length, 'words');
        
        // Verify the trie has words
        if (words.length === 0) {
          console.log('Cached trie is empty, rebuilding...');
          return false;
        }
        
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
      console.log('Building new trie from database...');
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      let processed = 0;
      for (const word of words) {
        const processedWord = processDigraphs(word.toUpperCase());
        trie.insert(processedWord, word);
        processed++;
        
        if (processed % 1000 === 0) {
          setLoadingProgress(Math.floor((processed / words.length) * 100));
        }
      }

      // Save serialized trie
      console.log('Saving trie to cache...');
      const serializedTrie = trie.serialize();
      await wordDB.saveTrie(serializedTrie);

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