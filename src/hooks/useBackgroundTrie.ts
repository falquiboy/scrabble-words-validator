import { useEffect, useMemo, useRef, useState } from 'react';
import { Trie } from '@/utils/trie';
import { SQLiteWordDatabase } from '@/services/SQLiteWordDatabase';
import { SqliteAnagramService } from '@/services/SqliteAnagramService';
import { HybridTrieService } from '@/services/HybridTrieService';
import type { LexiconReleaseDescriptor } from '@/lexicon/releases';
import {
  getTrieBuildDecision,
  markTrieBuildFailed,
  markTrieBuildStarted,
  markTrieBuildSucceeded,
  TRIE_BUILD_TIMEOUT_MS,
} from '@/utils/trieBuildPolicy';

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

const waitForIdleTurn = (): Promise<void> => {
  if ('requestIdleCallback' in window) {
    return new Promise((resolve) => {
      window.requestIdleCallback(() => resolve(), { timeout: 1_500 });
    });
  }
  return new Promise((resolve) => window.setTimeout(resolve, 250));
};

export const useBackgroundTrie = (
  enableUltraFastMode: boolean,
  release: LexiconReleaseDescriptor
): UseBackgroundTrieReturn => {
  const resources = useMemo(() => {
    const database = new SQLiteWordDatabase({
      manifestUrl: release.manifestUrl,
      minimumWordCount: release.minimumWordCount,
      label: release.publicLabel,
    });
    const sqliteService = new SqliteAnagramService(database);
    return {
      database,
      hybridService: new HybridTrieService(null, sqliteService, release.allowSupabaseFallback),
    };
  }, [
    release.allowSupabaseFallback,
    release.manifestUrl,
    release.minimumWordCount,
    release.publicLabel,
  ]);
  const { database, hybridService } = resources;
  const [isTrieReady, setIsTrieReady] = useState(false);
  const [trieProgress, setTrieProgress] = useState<TrieProgress | null>(null);
  const [status, setStatus] =
    useState<'loading' | 'building' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    let cancelled = false;
    let buildTimeout: number | null = null;
    let trieBuildStarted = false;

    const clearBuildTimeout = () => {
      if (buildTimeout !== null) {
        window.clearTimeout(buildTimeout);
        buildTimeout = null;
      }
    };

    const keepSQLiteActive = (message: string, cause?: unknown) => {
      clearBuildTimeout();
      workerRef.current?.terminate();
      workerRef.current = null;
      markTrieBuildFailed(release.key);
      trieBuildStarted = false;
      if (cause) console.error(message, cause);
      else console.warn(message);
      if (!cancelled) {
        setError('El Trie no estuvo disponible; SQLite sigue funcionando.');
        setStatus('ready');
      }
    };

    const initializeOfflineDictionary = async () => {
      try {
        setIsTrieReady(false);
        setTrieProgress(null);
        setError(null);
        setStatus('loading');
        await database.init();
        hybridService.notifySqliteReady();
        const wordCount = await database.getWordCount();
        if (cancelled) return;

        if (!enableUltraFastMode) {
          setTrieProgress({ progress: 100, processed: wordCount, total: wordCount });
          setStatus('ready');
          return;
        }

        const decision = getTrieBuildDecision(release.key);
        if (!decision.shouldBuild) {
          console.info(`SQLite-only mode: ${decision.reason}`);
          setTrieProgress({ progress: 100, processed: wordCount, total: wordCount });
          setStatus('ready');
          return;
        }

        // SQLite is usable now. Give rendering and the first interaction an idle
        // turn before the optional in-memory accelerator starts loading shards.
        setTrieProgress({ progress: 0, processed: 0, total: wordCount });
        setStatus('building');
        await waitForIdleTurn();
        if (cancelled) return;

        markTrieBuildStarted(release.key);
        trieBuildStarted = true;
        const words = await database.getAllWords();
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
            clearBuildTimeout();
            workerRef.current?.terminate();
            workerRef.current = null;
            try {
              const trie = new Trie();
              trie.deserialize(serializedTrie);
              if (cancelled) return;
              hybridService.upgradeTrie(trie);
              markTrieBuildSucceeded(release.key);
              trieBuildStarted = false;
              setIsTrieReady(true);
              setStatus('ready');
              setTrieProgress({ progress: 100, processed: count, total: count });
            } catch (deserializationError) {
              keepSQLiteActive('Trie deserialization failed; SQLite remains active.', deserializationError);
            }
            return;
          }

          if (type === 'ERROR') {
            keepSQLiteActive(
              'Trie worker failed; SQLite remains active.',
              new Error(event.data.message || 'Unknown worker error')
            );
          }
        };

        workerRef.current.onerror = (workerError) => {
          keepSQLiteActive('Trie worker failed; SQLite remains active.', workerError);
        };

        buildTimeout = window.setTimeout(() => {
          keepSQLiteActive('Trie build timed out; SQLite remains active.');
        }, TRIE_BUILD_TIMEOUT_MS);
        workerRef.current.postMessage({ type: 'BUILD_TRIE', words });
      } catch (initializationError) {
        console.error('Offline dictionary initialization failed.', initializationError);
        if (trieBuildStarted) markTrieBuildFailed(release.key);
        trieBuildStarted = false;
        clearBuildTimeout();
        workerRef.current?.terminate();
        workerRef.current = null;
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
      clearBuildTimeout();
      workerRef.current?.terminate();
      workerRef.current = null;
      database.close();
    };
  }, [database, enableUltraFastMode, hybridService, release.key]);

  return { hybridService, isTrieReady, trieProgress, status, error };
};
