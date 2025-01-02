import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { processDigraphs } from '@/utils/digraphs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const EXPECTED_WORD_COUNT = 639293;

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchWordsFromDB = async () => {
    try {
      // First try to get words from IndexedDB
      let words = await wordDB.getAllWords();
      console.log('Words in local database:', words.length);

      // If local DB is empty or has too few words, fetch from Supabase
      if (words.length < EXPECTED_WORD_COUNT) {
        console.log('Local DB incomplete, fetching from Supabase...');
        
        let allWords: string[] = [];
        let lastWord = '';
        const batchSize = 5000;
        let totalFetched = 0;
        
        while (true) {
          console.log(`Fetching batch after word: ${lastWord}`);
          const { data, error } = await supabase
            .from('words')
            .select('word')
            .gt('word', lastWord)
            .order('word')
            .limit(batchSize);
          
          if (error) {
            console.error('Supabase fetch error:', error);
            throw new Error(`Failed to fetch words: ${error.message}`);
          }
          
          if (!data || data.length === 0) {
            break;
          }
          
          totalFetched += data.length;
          console.log(`Fetched batch of ${data.length} words. Total: ${totalFetched}`);
          allWords = [...allWords, ...data.map(w => w.word.toUpperCase())];
          lastWord = data[data.length - 1].word;
          
          if (data.length < batchSize) {
            break;
          }
        }
        
        console.log('Total words fetched from Supabase:', allWords.length);
        
        if (allWords.length < EXPECTED_WORD_COUNT) {
          throw new Error(`Incomplete dictionary: got ${allWords.length} words, expected ${EXPECTED_WORD_COUNT}`);
        }
        
        words = allWords;
        
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
      console.log('Checking for serialized trie...');
      const serializedTrie = await wordDB.loadTrie();
      
      if (serializedTrie) {
        console.log('Found serialized trie, deserializing...');
        setLoadingProgress(50);
        trie.deserialize(serializedTrie);
        const words = trie.getAllWords();
        
        if (words.length < EXPECTED_WORD_COUNT) {
          console.log(`Cached trie is incomplete (${words.length}/${EXPECTED_WORD_COUNT} words), rebuilding...`);
          return false;
        }
        
        setWordCount(words.length);
        console.log('Trie loaded from cache with', words.length, 'words');
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

      // Clear the trie before rebuilding
      trie.clear();

      let processed = 0;
      const totalWords = words.length;
      
      for (const word of words) {
        const processedWord = processDigraphs(word.toUpperCase());
        trie.insert(processedWord, word);
        processed++;
        
        if (processed % 1000 === 0) {
          const progress = Math.floor((processed / totalWords) * 100);
          setLoadingProgress(progress);
          console.log(`Processing progress: ${progress}%`);
        }
      }

      // Validate trie size before saving
      const trieWords = trie.getAllWords();
      if (trieWords.length < EXPECTED_WORD_COUNT) {
        throw new Error(`Trie build incomplete: got ${trieWords.length} words, expected ${EXPECTED_WORD_COUNT}`);
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