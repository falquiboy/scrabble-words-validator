import { useState, useEffect } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { processDigraphs } from '@/utils/digraphs';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie, setTrie] = useState<Trie>(new Trie());
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const initTrie = async () => {
      try {
        console.log('Initializing trie...');
        const words = await wordDB.getAllWords();
        console.log(`Building trie with ${words.length} words...`);

        const newTrie = new Trie();
        words.forEach(word => {
          const processedWord = processDigraphs(word);
          newTrie.insert(processedWord, word);
        });

        setTrie(newTrie);
        setWordCount(words.length);
        console.log('Trie built successfully');
      } catch (err) {
        console.error('Error initializing trie:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize trie'));
      } finally {
        setIsLoading(false);
      }
    };

    initTrie();
  }, []);

  return { isLoading, error, wordCount, trie };
};