
import { useState, useEffect } from 'react';
import { wordDB } from '@/services/WordDatabase';
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

    const initDB = async () => {
      try {
        console.log('Initializing word database...');
        await wordDB.init();
        
        if (!mounted) return;

        const existingWords = await wordDB.getAllWords();
        console.log('Words in database:', existingWords.length);

        // Only fetch words if database is completely empty or incomplete
        if (existingWords.length === 0 || existingWords.length < EXPECTED_WORD_COUNT) {
          console.log('Database empty or incomplete, loading from CSV file...');
          await wordDB.clear();
          
          setStage('download');
          csvLoader = new CsvWordLoader(EXPECTED_WORD_COUNT);
          
          // Create a progress update interval
          const progressInterval = setInterval(() => {
            if (csvLoader) {
              const currentProgress = csvLoader.getProgress();
              setProgress(Math.floor(currentProgress));
            }
          }, 200);
          
          const csvSuccess = await csvLoader.loadCsvFile();
          clearInterval(progressInterval);
          
          if (csvSuccess) {
            console.log('Dictionary loaded from CSV file');
            const updatedWordCount = await wordDB.getAllWords();
            toast.success(`Dictionary loaded: ${updatedWordCount.length.toLocaleString()} words`);
          } else {
            console.log('CSV loading failed');
            toast.error('Error loading dictionary, please try again later');
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
