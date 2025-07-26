/**
 * Hook híbrido para anagramas: IndexedDB (inmediato) → Trie (cuando esté listo)
 * Reemplaza useOfflineAnagramSearch con fallback verdadero
 */

import { useState, useEffect } from 'react';
import { indexedDbAnagramService } from '@/services/IndexedDbAnagramService';
import { findPatternMatches } from "@/utils/pattern/matching";
import { HybridTrieService } from '@/services/HybridTrieService';
import { SearchResults } from "./anagramSearch/types";

export const useHybridAnagramSearch = (
  searchTerm: string,
  hybridService: HybridTrieService,
  showShorter: boolean,
  targetLength: number | null
) => {
  const [results, setResults] = useState<SearchResults>({
    exactMatches: [],
    wildcardMatches: [],
    additionalWildcardMatches: [],
    shorterMatches: [],
    patternMatches: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<'none' | 'indexeddb' | 'trie'>('none');

  useEffect(() => {
    const searchAnagrams = async () => {
      if (!searchTerm.trim()) {
        setResults({
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: [],
          patternMatches: []
        });
        setIsLoading(false);
        setError(null);
        setCurrentProvider('none');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const trimmedTerm = searchTerm.trim();
        console.log(`🔍 Hybrid anagram search: "${trimmedTerm}"`);

        // Check if it's a pattern search
        const isPatternSearch = trimmedTerm.includes('*') || 
                               trimmedTerm.includes('.') || 
                               trimmedTerm.includes('-') || 
                               trimmedTerm.includes(':');

        if (isPatternSearch) {
          console.log('🔍 Pattern search detected, using pattern matching');
          
          // Extract target length from pattern if it contains a colon
          let patternLength = targetLength;
          let cleanPattern = trimmedTerm;
          
          if (trimmedTerm.includes(':')) {
            const [patternPart, lengthStr] = trimmedTerm.split(':');
            if (lengthStr && /^\\d+$/.test(lengthStr)) {
              patternLength = parseInt(lengthStr, 10);
              cleanPattern = patternPart;
            }
          }

          // For patterns, use traditional pattern matching if Trie is available
          let patternMatches: string[] = [];
          if (hybridService.isTrieAvailable()) {
            const actualTrie = (hybridService as any).actualTrie;
            if (actualTrie) {
              patternMatches = await findPatternMatches(cleanPattern, actualTrie, showShorter, 8, patternLength);
              setCurrentProvider('trie');
            }
          }

          setResults({
            exactMatches: [],
            wildcardMatches: [],
            additionalWildcardMatches: [],
            shorterMatches: [],
            patternMatches
          });

        } else {
          // Regular anagram search with hybrid fallback
          console.log('🔤 Anagram search detected, using hybrid service');
          
          if (hybridService.isTrieAvailable()) {
            // Use Trie if available (ultra-fast, sync)
            console.log('🚀 Using Trie for anagrams (ultra-fast)');
            setCurrentProvider('trie');
            
            const exactMatches = hybridService.findAnagrams(trimmedTerm);
            
            // For subanagrams, we can use either Trie or IndexedDB
            let shorterMatches: string[] = [];
            if (showShorter) {
              // Use IndexedDB for subanagrams as it's optimized for this
              const indexedDbResults = await indexedDbAnagramService.findAnagrams(trimmedTerm, 2, true);
              shorterMatches = indexedDbResults.partialMatches;
            }

            setResults({
              exactMatches,
              wildcardMatches: [],
              additionalWildcardMatches: [],
              shorterMatches,
              patternMatches: []
            });

          } else {
            // Fallback to IndexedDB (fast, instant availability)
            console.log('⚡ Using IndexedDB fallback (instant availability)');
            setCurrentProvider('indexeddb');
            
            const indexedDbResults = await indexedDbAnagramService.findAnagrams(
              trimmedTerm, 
              2, 
              showShorter
            );

            setResults({
              exactMatches: indexedDbResults.exactMatches,
              wildcardMatches: [],
              additionalWildcardMatches: [],
              shorterMatches: indexedDbResults.partialMatches,
              patternMatches: []
            });
          }

          // Filter by target length if specified
          if (targetLength !== null) {
            setResults(prev => ({
              exactMatches: prev.exactMatches.filter(word => word.length === targetLength),
              wildcardMatches: prev.wildcardMatches.filter(word => word.length === targetLength),
              additionalWildcardMatches: prev.additionalWildcardMatches.filter(word => word.length === targetLength),
              shorterMatches: [], // Clear shorter when filtering by specific length
              patternMatches: prev.patternMatches.filter(word => word.length === targetLength)
            }));
          }
        }

      } catch (err) {
        console.error('❌ Hybrid anagram search error:', err);
        setError(err instanceof Error ? err.message : 'Error en la búsqueda');
        setResults({
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: [],
          patternMatches: []
        });
        setCurrentProvider('none');
      } finally {
        setIsLoading(false);
      }
    };

    searchAnagrams();
  }, [searchTerm, showShorter, targetLength, hybridService]);

  return {
    results,
    isLoading,
    error,
    currentProvider // Información adicional sobre qué servicio se está usando
  };
};