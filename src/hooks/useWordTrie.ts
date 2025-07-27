
import { useState, useEffect, useCallback, useRef } from 'react';
import { sqliteDB } from '@/services/SQLiteWordDatabase';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { buildTrieFromWords, loadCachedTrie, saveTrie } from '@/utils/trieOperations';
import { LoadingStage } from './useWordDatabase';
import { HybridTrieService } from '@/services/HybridTrieService';

// Known total word count from the database
const TOTAL_WORDS = 639293;

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(false); // Híbrido disponible inmediatamente
  const [isTrieBuilding, setIsTrieBuilding] = useState(false); // Separar el estado del Trie
  const isTrieConstructionInProgress = useRef(false); // Flag para evitar doble construcción (useRef no causa re-renders)
  const [error, setError] = useState<Error | null>(null);
  const [actualTrie] = useState<Trie>(() => new Trie());
  const [hybridService] = useState<HybridTrieService>(() => new HybridTrieService());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stage, setStage] = useState<LoadingStage>('initializing');

  const loadWordsFromCsv = async () => {
    try {
      setStage('download');
      const csvLoader = new CsvWordLoader(TOTAL_WORDS);
      const success = await csvLoader.loadCsvFile();
      
      if (success) {
        console.log('Words loaded from CSV successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading words from CSV:', error);
      return false;
    }
  };

  const fetchWordsFromDB = async () => {
    try {
      // Asegurar que SQLite esté inicializada
      await sqliteDB.init();
      let words = await sqliteDB.getAllWords();
      console.log('Words in SQLite database:', words.length);

      if (words.length === 0 || words.length < TOTAL_WORDS) {
        console.log('SQLite DB empty or incomplete, loading from CSV...');
        const csvSuccess = await loadWordsFromCsv();
        
        if (!csvSuccess) {
          setStage('processing');
          toast.error('Error al cargar el diccionario, por favor intente más tarde');
          return [];
        }
        
        // Esperar un poco para que SQLite termine de procesar
        console.log('⏳ Waiting for SQLite to finish processing...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get words from SQLite again after CSV load
        words = await sqliteDB.getAllWords();
        console.log('Words after CSV load:', words.length);
        
        // Si aún está incompleta, esperar más
        let retries = 0;
        while (words.length < TOTAL_WORDS && retries < 10) {
          console.log(`⏳ SQLite still processing... ${words.length}/${TOTAL_WORDS} (retry ${retries + 1}/10)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          words = await sqliteDB.getAllWords();
          retries++;
        }
      }
      
      return words;
    } catch (error) {
      console.error('Error fetching words from SQLite:', error);
      throw error;
    }
  };

  const buildTrie = useCallback(async () => {
    try {
      // Intentar cargar Trie desde SQLite cache primero
      await sqliteDB.init();
      const cachedTrieData = await sqliteDB.loadTrie();
      
      if (cachedTrieData) {
        // Reconstruir Trie desde datos serializados de SQLite
        const wordCount = cachedTrieData.wordCount || 0;
        if (wordCount >= TOTAL_WORDS) {
          // TODO: Deserializar el Trie (por ahora usar método legacy)
          console.log('Trie cache found in SQLite, falling back to legacy cache');
        }
      }
      
      // Fallback al cache legacy
      const cachedWordCount = await loadCachedTrie(actualTrie);
      
      if (cachedWordCount > 0 && cachedWordCount >= TOTAL_WORDS) {
        setWordCount(cachedWordCount);
        console.log('Trie loaded from legacy cache with', cachedWordCount, 'words');
        
        // ✅ Actualizar el servicio híbrido con el Trie listo
        hybridService.updateTrie(actualTrie);
        console.log('🎯 Hybrid service updated with cached Trie');
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error loading cached trie:', err);
      return false;
    }
  }, [actualTrie, hybridService]);

  const buildTrieFromLocalDb = useCallback(async () => {
    // Evitar construcción doble usando useRef
    if (isTrieConstructionInProgress.current) {
      console.log('🚫 Trie construction already in progress, skipping...');
      return;
    }

    try {
      isTrieConstructionInProgress.current = true;
      setStage('building');
      
      const words = await fetchWordsFromDB();
      console.log(`Building trie with ${words.length} words...`);

      await buildTrieFromWords(words, actualTrie, (progress) => {
        setLoadingProgress(progress);
      });
      
      // Guardar en ambos lugares: legacy y SQLite
      await saveTrie(actualTrie);
      
      // Guardar también en SQLite cache (con metadata)
      try {
        const serializedTrie = actualTrie; // TODO: Serialize properly
        await sqliteDB.saveTrie({ 
          wordCount: words.length, 
          data: serializedTrie,
          timestamp: Date.now()
        });
        console.log('💾 Trie saved to SQLite cache');
      } catch (sqliteError) {
        console.warn('⚠️ Failed to save Trie to SQLite cache:', sqliteError);
      }

      setWordCount(words.length);
      setStage('complete');
      
      // ✅ Actualizar el servicio híbrido con el Trie construido
      hybridService.updateTrie(actualTrie);
      console.log('🎯 Hybrid service updated with built Trie');
      
      console.log('Trie built and cached successfully with', words.length, 'words');
    } catch (err) {
      console.error('Error building trie:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al inicializar el diccionario';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      isTrieConstructionInProgress.current = false;
    }
  }, [actualTrie, hybridService]);

  useEffect(() => {
    // ✅ Servicio híbrido disponible desde el primer momento
    console.log('🚀 Hybrid service ready for immediate use (IndexedDB fallback)');
    // isLoading ya está en false - UI disponible inmediatamente
  }, []);

  useEffect(() => {
    const initTrie = async () => {
      try {
        setIsTrieBuilding(true); // Solo trackear construcción del Trie
        setStage('building');
        const loadedFromCache = await buildTrie();
        if (!loadedFromCache) {
          await buildTrieFromLocalDb();
        } else {
          setStage('complete');
        }
      } catch (err) {
        console.error('Error initializing trie:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al inicializar el diccionario';
        setError(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        setIsTrieBuilding(false);
        setLoadingProgress(100);
        setStage('complete');
      }
    };

    initTrie();
  }, [buildTrie, buildTrieFromLocalDb]);

  return { 
    isLoading, 
    error, 
    wordCount, 
    trie: hybridService, // ✅ Retornar el servicio híbrido en lugar del Trie directo
    loadingProgress, 
    stage 
  };
};

// Import and re-export CsvWordLoader to make TypeScript happy
import { CsvWordLoader } from '@/services/CsvWordLoader';
export { CsvWordLoader };
