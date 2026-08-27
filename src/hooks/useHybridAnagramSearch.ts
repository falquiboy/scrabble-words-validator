/**
 * Hook híbrido para anagramas: IndexedDB (inmediato) → Trie (cuando esté listo)
 * Reemplaza useOfflineAnagramSearch con fallback verdadero
 */

import { useState, useEffect, useRef } from 'react';
// import { indexedDbAnagramService } from '@/services/IndexedDbAnagramService'; // Deprecated - using hybrid service
import type { WordSearchService } from '@/lexicon/types';
import { SearchResults } from "./anagramSearch/types";
import { sortWordsByAddedLetter } from "@/utils/additionalLetterSort";
import { parseUserQuery } from "@/utils/queryLanguage.mjs";
import { partitionShorterWordsWithWildcards } from '@/utils/wildcardSubanagrams';
import { getInternalLength } from '@/utils/digraphs';
// UserActivityContext removed - simplified approach

export const useHybridAnagramSearch = (
  searchTerm: string,
  hybridService: WordSearchService,
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
  const [currentProvider, setCurrentProvider] = useState<string>('none');
  const searchGenerationRef = useRef(0);
  
  // User activity signaling removed

  useEffect(() => {
    const generation = ++searchGenerationRef.current;
    let cancelled = false;

    const searchAnagrams = async () => {
      const query = parseUserQuery(searchTerm);
      const effectiveTargetLength = query.length ?? targetLength;

      if (!searchTerm.trim()) {
        const emptyResults = {
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: [],
          patternMatches: []
        };
        setResults(emptyResults);
        setIsLoading(false);
        setError(null);
        setCurrentProvider('none');
        return;
      }

      // REMOVED: Minimum length validation for all searches
      // Spanish Scrabble has valid 1-letter words (A, E, O, Y)
      // Pattern searches should work with any length
      // Let the user search for whatever they want!

      console.log('🔄 Setting loading to TRUE');
      setIsLoading(true);
      setError(null);

      // 🎯 Signal user searching activity for smart Trie upgrade
      // Search signaling removed

      try {
        const trimmedTerm = query.normalized;
        console.log(`🔍 Hybrid anagram search: "${trimmedTerm}"`);

        const isPatternSearch = query.kind === 'pattern';
        const isWildcardSearch = query.kind === 'anagram' && query.wildcardCount > 0;
        const wildcardCount = query.wildcardCount;


        if (isPatternSearch) {
          console.log('🔍 Pattern search detected, using pattern matching');
          
          // For patterns, use hybrid service with full fallback chain
          const patternMatches = await hybridService.findPatternMatches(trimmedTerm, showShorter, 8, effectiveTargetLength);
          if (cancelled || generation !== searchGenerationRef.current) return;
          setCurrentProvider(hybridService.getCurrentProvider());

          // Solo actualizar cuando tengamos los resultados completos
          const patternResults = {
            exactMatches: [],
            wildcardMatches: [],
            additionalWildcardMatches: [],
            shorterMatches: [],
            patternMatches
          };
          
          setResults(patternResults);
          console.log('✅ Setting loading to FALSE (pattern search)');
          setIsLoading(false);

        } else if (isWildcardSearch) {
          // 🎯 Wildcard anagram search (?)
          if (wildcardCount > 2) {
            throw new Error(`Máximo 2 comodines permitidos, encontrados: ${wildcardCount}`);
          }
          
          const wildcardResults = await hybridService.findAnagramsWithWildcards(query.letters, showShorter);
          if (cancelled || generation !== searchGenerationRef.current) return;
          
          // Ordenar palabras con letra adicional según la letra añadida
          const baseLetters = query.letters.replace(/\?/g, ''); // Remover comodines para obtener letras base
          const sortedAdditionalMatches = sortWordsByAddedLetter(baseLetters, wildcardResults.additionalWildcardMatches);
          
          // Set provider based on what was actually used
          setCurrentProvider(hybridService.getCurrentProvider());

          const shorterGroups = showShorter
            ? partitionShorterWordsWithWildcards(wildcardResults.shorterMatches, query.letters)
            : { relevantWithWildcard: [], withoutWildcard: [] };
          
          // La vista de palabras más cortas sigue siendo excluyente y admite
          // resultados formados con cero o un comodín, nunca con dos.
          const wildcardFullResults = showShorter
            ? {
                exactMatches: [],
                wildcardMatches: shorterGroups.relevantWithWildcard,
                additionalWildcardMatches: [],
                shorterMatches: shorterGroups.withoutWildcard,
                patternMatches: []
              }
            : {
                exactMatches: wildcardResults.exactMatches,
                wildcardMatches: wildcardResults.wildcardMatches,
                additionalWildcardMatches: sortedAdditionalMatches,
                shorterMatches: [],
                patternMatches: []
              };
          const displayedWildcardResults = effectiveTargetLength === null
            ? wildcardFullResults
            : {
                exactMatches: wildcardFullResults.exactMatches.filter(
                  word => getInternalLength(word) === effectiveTargetLength
                ),
                wildcardMatches: wildcardFullResults.wildcardMatches.filter(
                  word => getInternalLength(word) === effectiveTargetLength
                ),
                additionalWildcardMatches: wildcardFullResults.additionalWildcardMatches.filter(
                  word => getInternalLength(word) === effectiveTargetLength
                ),
                shorterMatches: wildcardFullResults.shorterMatches.filter(
                  word => getInternalLength(word) === effectiveTargetLength
                ),
                patternMatches: []
              };
          setResults(displayedWildcardResults);
          console.log('✅ Setting loading to FALSE (wildcard search)');
          setIsLoading(false);

        } else {
          // Regular anagram search with hybrid fallback
          
          if (hybridService.isTrieAvailable()) {
            // Use Trie if available (ultra-fast, sync)
            setCurrentProvider('trie');
            
            const exactMatches = hybridService.findAnagrams(query.letters);
            const additionalMatchesPromise = hybridService.findAnagramsWithOneAdditionalLetter(query.letters);

            if (!showShorter && !cancelled && generation === searchGenerationRef.current) {
              const exactResults = {
                exactMatches,
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: [],
                patternMatches: []
              };
              setResults(exactResults);
              setIsLoading(false);
            }

            const additionalWildcardMatches = sortWordsByAddedLetter(
              query.letters,
              await additionalMatchesPromise
            );
            
            // Obtener subanagramas solo si showShorter está activo (optimización)
            let allShorterMatches: string[] = [];
            if (showShorter) {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(query.letters, true);
              allShorterMatches = extendedResults.shorterMatches;
            }

            if (cancelled || generation !== searchGenerationRef.current) return;

            // Mostrar según toggle (excluyente)
            if (showShorter) {
              setResults({
                exactMatches: [],
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: allShorterMatches,
                patternMatches: []
              });
            } else {
              setResults({
                exactMatches,
                wildcardMatches: [],
                additionalWildcardMatches,
                shorterMatches: [],
                patternMatches: []
              });
            }
            
          } else {
            // Use hybrid service async fallback (SQLite → Supabase)
            
            const exactMatchesPromise = hybridService.findAnagramsAsync(query.letters);
            const additionalMatchesPromise = hybridService.findAnagramsWithOneAdditionalLetter(query.letters);
            const exactMatches = await exactMatchesPromise;

            if (!showShorter && !cancelled && generation === searchGenerationRef.current) {
              const exactResults = {
                exactMatches,
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: [],
                patternMatches: []
              };
              setResults(exactResults);
              setIsLoading(false);
            }

            const additionalWildcardMatches = sortWordsByAddedLetter(
              query.letters,
              await additionalMatchesPromise
            );
            
            // Obtener subanagramas solo si showShorter está activo (optimización)
            let allShorterMatches: string[] = [];
            if (showShorter) {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(query.letters, true);
              allShorterMatches = extendedResults.shorterMatches;
            }

            if (cancelled || generation !== searchGenerationRef.current) return;

            // Set provider based on what was actually used
            setCurrentProvider(hybridService.getCurrentProvider());

            // Mostrar según toggle (excluyente)
            if (showShorter) {
              setResults({
                exactMatches: [],
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: allShorterMatches,
                patternMatches: []
              });
            } else {
              setResults({
                exactMatches,
                wildcardMatches: [],
                additionalWildcardMatches,
                shorterMatches: [],
                patternMatches: []
              });
            }
            
          }

          if (cancelled || generation !== searchGenerationRef.current) return;

          // Filter by target length if specified (ANTES de setIsLoading)
          if (effectiveTargetLength !== null) {
            setResults(prev => ({
              exactMatches: prev.exactMatches.filter(word => getInternalLength(word) === effectiveTargetLength),
              wildcardMatches: prev.wildcardMatches.filter(word => getInternalLength(word) === effectiveTargetLength),
              additionalWildcardMatches: prev.additionalWildcardMatches.filter(word => getInternalLength(word) === effectiveTargetLength),
              shorterMatches: prev.shorterMatches.filter(word => getInternalLength(word) === effectiveTargetLength),
              patternMatches: prev.patternMatches.filter(word => getInternalLength(word) === effectiveTargetLength)
            }));
          }
          
          console.log('✅ Setting loading to FALSE (hybrid/sqlite search)');
          setIsLoading(false);
        }

      } catch (err) {
        if (cancelled || generation !== searchGenerationRef.current) return;
        console.error('❌ Hybrid anagram search error:', err);
        setError(err instanceof Error ? err.message : 'Error en la búsqueda');
        const errorResults = {
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: [],
          patternMatches: []
        };
        setResults(errorResults);
        setCurrentProvider('none');
        console.log('❌ Setting loading to FALSE (error case)');
        setIsLoading(false);
      }
    };

    void searchAnagrams();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, targetLength, hybridService, showShorter]);

  return {
    results,
    isLoading,
    error,
    currentProvider // Información adicional sobre qué servicio se está usando
  };
};
