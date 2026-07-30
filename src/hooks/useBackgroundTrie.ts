import { useEffect, useRef, useState } from 'react';
import { Trie } from '@/utils/trie';
import { sqliteDB } from '@/services/SQLiteWordDatabase';
import { HybridTrieService } from '@/services/HybridTrieService';

interface TrieProgress {
  progress: number;
  processed: number;
  total: number;
}

interface UseBackgroundTrieReturn {
  hybridService: HybridTrieService;
  isTrieReady: boolean;
  trieProgress: TrieProgress | null;
  status: 'loading' | 'building' | 'ready' | 'error';
  error: string | null;
}

const shouldKeepOnlySQLite = (): boolean => {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const isAppleTouchDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const hasTightMemory =
    navigatorWithMemory.deviceMemory !== undefined &&
    navigatorWithMemory.deviceMemory <= 4;

  return isAppleTouchDevice || hasTightMemory;
};

export const useBackgroundTrie = (
  enableUltraFastMode = false
): UseBackgroundTrieReturn => {
  const [hybridService] = useState(() => new HybridTrieService(null));
  const [isTrieReady, setIsTrieReady] = useState(false);
  const [trieProgress, setTrieProgress] = useState<TrieProgress | null>(null);
  const [status, setStatus] =
    useState<'loading' | 'building' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeOfflineDictionary = async () => {
      try {
        setStatus('loading');
        await sqliteDB.init();
        const wordCount = await sqliteDB.getWordCount();
        if (cancelled) return;

        // En iPhone/iPad SQLite es el índice rápido. Construir además el árbol
        // de objetos JS duplica varias veces el diccionario y Safari lo cierra.
        if (!enableUltraFastMode || shouldKeepOnlySQLite()) {
          setTrieProgress({ progress: 100, processed: wordCount, total: wordCount });
          setStatus('ready');
          return;
        }

        setStatus('building');
        const words = await sqliteDB.getAllWords();
        if (cancelled) return;
        if (!words.length) throw new Error('No words found in database');

        workerRef.current = new Worker('/trie-builder.worker.js');
        workerRef.current.onmessage = (event) => {
          const { type, progress, processed, total, serializedTrie, wordCount: count } =
            event.data;

          if (type === 'PROGRESS') {
            setTrieProgress({ progress, processed, total });
            return;
          }

          if (type === 'COMPLETE') {
            if (cancelled) return;
            const trie = new Trie();
            trie.deserialize(serializedTrie);
            hybridService.upgradeTrie(trie);
            setIsTrieReady(true);
            setStatus('ready');
            setTrieProgress({ progress: 100, processed: count, total: count });
            workerRef.current?.terminate();
            workerRef.current = null;
          }
        };

        workerRef.current.onerror = (workerError) => {
          console.error('Trie worker failed; SQLite remains active.', workerError);
          if (!cancelled) {
            setError('No se pudo construir el Trie; SQLite sigue disponible.');
            setStatus('ready');
          }
          workerRef.current?.terminate();
          workerRef.current = null;
        };

        workerRef.current.postMessage({ type: 'BUILD_TRIE', words });
      } catch (initializationError) {
        console.error('Offline dictionary initialization failed.', initializationError);
        if (!cancelled) {
          // HybridTrieService conserva Supabase como último fallback online.
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : 'No se pudo preparar el diccionario offline.'
          );
          setStatus('ready');
        }
      }
    };

    void initializeOfflineDictionary();

    return () => {
      cancelled = true;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [enableUltraFastMode, hybridService]);

  return { hybridService, isTrieReady, trieProgress, status, error };
};
