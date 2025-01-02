import { useState, useEffect } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { WordLoader } from '@/services/WordLoader';
import { toast } from 'sonner';

const EXPECTED_WORD_COUNT = 639293;

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadStartTime] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    const initDB = async () => {
      try {
        console.log('Initializing word database...');
        await wordDB.init();
        
        if (!mounted) return;

        const existingWords = await wordDB.getAllWords();
        console.log('Words in database:', existingWords.length);

        // Only rebuild if we don't have the expected number of words
        if (existingWords.length !== EXPECTED_WORD_COUNT) {
          console.log('Dictionary needs rebuilding...');
          
          // Check if it's been less than 24 hours since the last attempt
          const lastAttempt = localStorage.getItem('lastDictionaryBuildAttempt');
          const now = Date.now();
          
          if (lastAttempt && (now - parseInt(lastAttempt)) < 24 * 60 * 60 * 1000) {
            console.log('Using existing dictionary despite incomplete word count');
            setIsLoading(false);
            return;
          }

          await wordDB.clear();
          const loader = new WordLoader(EXPECTED_WORD_COUNT);

          for await (const words of loader.loadWords()) {
            if (!mounted) return;
            
            await wordDB.addWords(words);
            const currentProgress = loader.getProgress();
            setProgress(Math.floor(currentProgress));

            if (currentProgress % 10 === 0) {
              console.log(`Loading progress: ${currentProgress.toFixed(1)}%`);
            }
          }

          // Store the timestamp of this successful build
          localStorage.setItem('lastDictionaryBuildAttempt', now.toString());
          toast.success(`Dictionary loaded: ${EXPECTED_WORD_COUNT.toLocaleString()} words`);
        } else {
          console.log('Dictionary is up to date');
          toast.success(`Dictionary ready: ${EXPECTED_WORD_COUNT.toLocaleString()} words`);
        }
      } catch (err) {
        console.error('Dictionary initialization error:', err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to initialize dictionary';
          setError(message);
          toast.error(message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initDB();

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoading, error, progress, loadStartTime };
};