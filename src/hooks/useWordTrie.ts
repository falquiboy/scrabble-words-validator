/**
 * Hook principal que expone el sistema de Trie con construcción background
 * Usa Web Worker para construcción no-bloqueante y fallback inmediato
 */

import { useEffect, useMemo, useState } from 'react';
import { useBackgroundTrie } from './useBackgroundTrie';
import { lexiconCatalog } from '@/lexicon/LexiconCatalog';
import { releaseForMode, wordCountForMode } from '@/lexicon/releases';
import type { LexiconMode, WordSearchService } from '@/lexicon/types';
import { HybridLexiconSearchService } from '@/services/HybridLexiconSearchService';

// Re-export del hook background como interfaz principal
export const useWordTrie = (
  enableUltraFastMode: boolean = false,
  mode: LexiconMode = '2017'
) => {
  const release = releaseForMode(mode);
  const { hybridService, isTrieReady, trieProgress, status, error } =
    useBackgroundTrie(enableUltraFastMode, release);
  const [catalogState, setCatalogState] = useState<{
    mode: LexiconMode;
    status: 'ready' | 'loading' | 'error';
    error: string | null;
  }>({ mode, status: mode === '2017' ? 'ready' : 'loading', error: null });

  useEffect(() => {
    if (mode === '2017') {
      setCatalogState({ mode, status: 'ready', error: null });
      return;
    }

    let cancelled = false;
    setCatalogState({ mode, status: 'loading', error: null });
    void lexiconCatalog.load().then(() => {
      if (!cancelled) setCatalogState({ mode, status: 'ready', error: null });
    }).catch((catalogError) => {
      if (!cancelled) {
        setCatalogState({
          mode,
          status: 'error',
          error: catalogError instanceof Error ? catalogError.message : 'No se pudo cargar el catálogo.',
        });
      }
    });
    return () => { cancelled = true; };
  }, [mode]);

  const catalogReady = catalogState.mode === mode && catalogState.status === 'ready';
  const searchService = useMemo<WordSearchService>(() => {
    if (mode === 'hybrid' && catalogReady) {
      return new HybridLexiconSearchService(hybridService, lexiconCatalog.getLegacyWords());
    }
    return hybridService;
  }, [catalogReady, hybridService, mode]);
  
  // Mapear los estados para compatibilidad con la interfaz legacy
  // SQLite is already usable while the optional Trie is built in background.
  const isLoading = status === 'loading' || !catalogReady;
  const isTrieBuilding = status === 'building';
  const loadingProgress = trieProgress ? trieProgress.progress : (status === 'ready' ? 100 : 0);
  
  // Mapear stage para compatibilidad
  const stage = status === 'loading' ? 'initializing' as const : 
                status === 'building' ? 'building' as const :
                status === 'ready' ? 'complete' as const :
                'error' as const;

  // Estimar word count basado en progreso
  const releaseWordCount = trieProgress ? trieProgress.total : release.minimumWordCount;
  const wordCount = status === 'ready' || status === 'building'
    ? (mode === 'hybrid' ? wordCountForMode(mode) : releaseWordCount)
    : 0;
  const combinedError = error ?? (catalogState.mode === mode ? catalogState.error : null);
  
  return {
    isLoading,
    isTrieBuilding,
    isTrieReady,
    error: combinedError ? new Error(combinedError) : null,
    wordCount,
    trie: searchService,
    catalog: lexiconCatalog,
    mode,
    loadingProgress,
    stage
  };
};

// Legacy export for backwards compatibility
export type LoadingStage = 'initializing' | 'download' | 'processing' | 'building' | 'complete' | 'error';
