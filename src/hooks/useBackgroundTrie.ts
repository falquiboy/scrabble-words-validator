/**
 * Hook para construcción de Trie en background usando Web Worker
 * Permite que la UI sea responsiva mientras se construye el Trie
 */

import { useState, useEffect, useRef } from 'react';
import { Trie } from '@/utils/trie';
import { sqliteDB } from '@/services/SQLiteWordDatabase';
import { HybridTrieService } from '@/services/HybridTrieService';
import { loadCachedTrie, saveTrie } from '@/utils/trieOperations';

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

export const useBackgroundTrie = (): UseBackgroundTrieReturn => {
  // Initialize HybridService immediately WITHOUT Trie (fallback ready from second 1)
  const [hybridService] = useState(() => new HybridTrieService(null));
  const [isTrieReady, setIsTrieReady] = useState(false);
  const [trieProgress, setTrieProgress] = useState<TrieProgress | null>(null);
  const [status, setStatus] = useState<'loading' | 'building' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const buildTrieInBackground = async () => {
      try {
        console.log('🚀 Starting background Trie construction...');
        
        // Try to load cached Trie first
        const trie = new Trie();
        const cachedWordCount = await loadCachedTrie(trie);
        
        if (cachedWordCount > 0) {
          console.log(`✅ Loaded cached Trie with ${cachedWordCount} words`);
          hybridService.upgradeTrie(trie);
          setIsTrieReady(true);
          setStatus('ready');
          return;
        }

        console.log('📦 No cached Trie found, building from words...');
        setStatus('building');

        // Get words from SQLite
        await sqliteDB.init();
        const words = await sqliteDB.getAllWords();
        
        if (words.length === 0) {
          throw new Error('No words found in database');
        }

        console.log(`🔧 Building Trie with ${words.length} words using Web Worker...`);

        // Create Web Worker
        workerRef.current = new Worker('/trie-builder.worker.js');
        
        workerRef.current.onmessage = (e) => {
          const { type, progress, processed, total, serializedTrie, wordCount } = e.data;
          
          if (type === 'PROGRESS') {
            setTrieProgress({ progress, processed, total });
            console.log(`⚙️ Trie building progress: ${progress}% (${processed}/${total})`);
          } else if (type === 'COMPLETE') {
            console.log('🎉 Trie construction completed, deserializing...');
            
            // Deserialize the Trie
            const trie = new Trie();
            trie.deserialize(serializedTrie);
            
            // Hot upgrade the service
            hybridService.upgradeTrie(trie);
            setIsTrieReady(true);
            setStatus('ready');
            setTrieProgress(null);
            
            // Save to cache for next time
            saveTrie(trie);
            
            console.log(`✅ Trie hot upgrade complete! ${wordCount} words ready`);
            
            // Clean up worker
            workerRef.current?.terminate();
            workerRef.current = null;
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('❌ Web Worker error:', error);
          setError('Error building Trie');
          setStatus('error');
          workerRef.current?.terminate();
          workerRef.current = null;
        };

        // Start building
        workerRef.current.postMessage({
          type: 'BUILD_TRIE',
          words
        });

      } catch (err) {
        console.error('❌ Background Trie construction failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };

    buildTrieInBackground();

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [hybridService]);

  return {
    hybridService, // Always available from second 1!
    isTrieReady,
    trieProgress,
    status,
    error
  };
};