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

        // Only fetch words if database is completely empty
        if (existingWords.length === 0) {
          console.log('Database empty, fetching words...');
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

          toast.success(`Dictionary loaded: ${EXPECTED_WORD_COUNT.toLocaleString()} words`);
        } else {
          console.log('Using existing dictionary');
          toast.success(`Dictionary ready: ${existingWords.length.toLocaleString()} words`);
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