
import { useState, useEffect, useRef } from 'react';
import { wordDB } from '@/services/WordDatabase';
import { CsvWordLoader } from '@/services/CsvWordLoader';
import { toast } from 'sonner';

const EXPECTED_WORD_COUNT = 639293;

// Loading stages definitions
export type LoadingStage = 'initializing' | 'download' | 'processing' | 'building' | 'complete';

export interface LoadingProgress {
  stage: LoadingStage;
  current: number;
  total: number;
  percent: number;
  message: string;
}

export const useWordDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LoadingProgress>({
    stage: 'initializing',
    current: 0,
    total: 100,
    percent: 0,
    message: 'Iniciando aplicación'
  });
  const [loadStartTime] = useState<number>(Date.now());
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(0);
  const csvLoaderRef = useRef<CsvWordLoader | null>(null);

  useEffect(() => {
    let mounted = true;

    const initDB = async () => {
      try {
        console.log('Initializing word database...');
        await wordDB.init();
        
        if (!mounted) return;

        const existingWords = await wordDB.getAllWords();
        console.log('Words in database:', existingWords.length);
        
        // Update word count
        setWordCount(existingWords.length);

        // Only fetch words if database is completely empty or incomplete
        if (existingWords.length === 0 || existingWords.length < EXPECTED_WORD_COUNT) {
          console.log('Database empty or incomplete, loading from CSV file...');
          setIsFirstLoad(true);
          await wordDB.clear();
          
          // Start download stage
          setProgress({
            stage: 'download',
            current: 0,
            total: 100,
            percent: 0,
            message: 'Descargando diccionario'
          });
          
          csvLoaderRef.current = new CsvWordLoader(EXPECTED_WORD_COUNT);
          
          // Create a progress update interval
          const progressInterval = setInterval(() => {
            if (csvLoaderRef.current && mounted) {
              const currentProgress = csvLoaderRef.current.getProgress();
              setProgress(prev => ({
                ...prev,
                current: Math.floor(currentProgress),
                percent: Math.floor(currentProgress),
              }));
            }
          }, 200);
          
          const csvSuccess = await csvLoaderRef.current.loadCsvFile();
          clearInterval(progressInterval);
          
          if (csvSuccess) {
            console.log('Dictionary loaded from CSV file');
            
            // Transition to the processing/building stage for trie construction
            setProgress({
              stage: 'building',
              current: 0,
              total: 100,
              percent: 0,
              message: 'Preparando diccionario'
            });
            
            const updatedWordCount = await wordDB.getAllWords();
            setWordCount(updatedWordCount.length);
            // Removed toast.success notification here
          } else {
            console.log('CSV loading failed');
            toast.error('Error al cargar el diccionario, por favor intente más tarde');
          }
        } else {
          console.log('Using existing dictionary');
          setProgress({
            stage: 'complete',
            current: 100,
            total: 100,
            percent: 100,
            message: 'Diccionario listo'
          });
          // Removed toast.success notification here
        }
      } catch (err) {
        console.error('Dictionary initialization error:', err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Error al inicializar el diccionario';
          setError(message);
          toast.error(message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setProgress(prev => ({
            ...prev,
            stage: 'complete',
            percent: 100
          }));
        }
      }
    };

    initDB();

    return () => {
      mounted = false;
      if (csvLoaderRef.current) {
        csvLoaderRef.current.cancel();
      }
    };
  }, []);

  return { 
    isLoading, 
    error, 
    progress, 
    loadStartTime, 
    isFirstLoad,
    wordCount
  };
};
