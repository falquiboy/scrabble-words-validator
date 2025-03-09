
import { useState, useEffect } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { WordLoader } from '@/services/WordLoader';
import { CsvWordLoader } from '@/services/CsvWordLoader';
import { toast } from 'sonner';

const EXPECTED_WORD_COUNT = 639293;

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadStartTime] = useState(Date.now());
  const [stage, setStage] = useState<'download' | 'processing' | 'building'>('processing');

  useEffect(() => {
    let mounted = true;
    let csvLoader: CsvWordLoader | null = null;
    let wordLoader: WordLoader | null = null;

    const initDB = async () => {
      try {
        console.log('Initializing word database...');
        await wordDB.init();
        
        if (!mounted) return;

        const existingWords = await wordDB.getAllWords();
        console.log('Words in database:', existingWords.length);

        // Only fetch words if database is completely empty
        if (existingWords.length === 0) {
          console.log('Database empty, checking for CSV file...');
          await wordDB.clear();
          
          // First try to load from CSV
          setStage('download');
          csvLoader = new CsvWordLoader(EXPECTED_WORD_COUNT);
          const csvSuccess = await csvLoader.loadCsvFile();
          
          if (csvSuccess) {
            console.log('Dictionary loaded from CSV file');
          } else {
            console.log('CSV loading failed or not available, fetching from Supabase DB...');
            setStage('processing');
            wordLoader = new WordLoader(EXPECTED_WORD_COUNT);
            
            for await (const words of wordLoader.loadWords()) {
              if (!mounted) return;
              
              await wordDB.addWords(words);
              const currentProgress = wordLoader.getProgress();
              setProgress(Math.floor(currentProgress));

              if (currentProgress % 10 === 0) {
                console.log(`Loading progress: ${currentProgress.toFixed(1)}%`);
              }
            }
            
            toast.success(`Dictionary loaded: ${EXPECTED_WORD_COUNT.toLocaleString()} words`);
          }
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
      if (csvLoader) {
        csvLoader.cancel();
      }
    };
  }, []);

  return { isLoading, error, progress, loadStartTime, stage };
};
