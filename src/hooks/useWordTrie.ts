import { useState, useEffect, useCallback } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { processDigraphs } from '@/utils/digraphs';
import { toast } from 'sonner';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);

  const buildTrie = useCallback(async () => {
    try {
      console.log('Initializing trie...');
      const words = await wordDB.getAllWords();
      console.log(`Building trie with ${words.length} words...`);

      words.forEach(word => {
        const processedWord = processDigraphs(word);
        trie.insert(processedWord, word);
      });

      setWordCount(words.length);
      console.log('Trie built successfully');
    } catch (err) {
      console.error('Error initializing trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trie';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [trie]);

  useEffect(() => {
    buildTrie();
  }, [buildTrie]);

  return { isLoading, error, wordCount, trie };
};