/**
 * Hook híbrido para anagramas: IndexedDB (inmediato) → Trie (cuando esté listo)
 * Reemplaza useOfflineAnagramSearch con fallback verdadero
 */

import { useState, useEffect, useRef } from 'react';
// import { indexedDbAnagramService } from '@/services/IndexedDbAnagramService'; // Deprecated - using hybrid service
import type { WordSearchService } from '@/lexicon/types';
import { SearchResults } from "./anagramSearch/types";
import { sortWordsByAddedLetter } from "@/utils/additionalLetterSort";
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
  // Cache completo para evitar re-búsquedas al cambiar toggle
  const [fullResults, setFullResults] = useState<SearchResults>({
    exactMatches: [],
    wildcardMatches: [],
    additionalWildcardMatches: [],
    shorterMatches: [],
    patternMatches: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string>('none');
  const [lastSearchTerm, setLastSearchTerm] = useState<string>('');
  const searchGenerationRef = useRef(0);

  useEffect(() => {
    setLastSearchTerm('');
    setFullResults({ exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], shorterMatches: [], patternMatches: [] });
  }, [hybridService]);
  
  // User activity signaling removed

  // Efecto para cambios en el toggle (con carga lazy de subanagramas)
  useEffect(() => {
    const handleToggleChange = async () => {
      if (lastSearchTerm === searchTerm && searchTerm.trim()) {
        
        if (showShorter) {
          // Cargar subanagramas si no están en cache
          if (fullResults.shorterMatches.length === 0) {
            setIsLoading(true);
            try {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(searchTerm, true);
              const updatedFullResults = {
                ...fullResults,
                shorterMatches: extendedResults.shorterMatches
              };
              setFullResults(updatedFullResults);
              
              // Mostrar SOLO subanagramas
              setResults({
                exactMatches: [],
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: extendedResults.shorterMatches,
                patternMatches: []
              });
            } catch (error) {
              console.error('❌ Error loading subanagrams:', error);
              setError('Error cargando subanagramas');
            } finally {
              setIsLoading(false);
            }
          } else {
            // Usar cache existente
            setResults({
              exactMatches: [],
              wildcardMatches: [],
              additionalWildcardMatches: [],
              shorterMatches: fullResults.shorterMatches,
              patternMatches: []
            });
          }
        } else {
          // Mostrar resultados normales (exactos + adicionales)
          setResults({
            exactMatches: fullResults.exactMatches,
            wildcardMatches: fullResults.wildcardMatches,
            additionalWildcardMatches: fullResults.additionalWildcardMatches,
            shorterMatches: [],
            patternMatches: fullResults.patternMatches
          });
        }
      }
    };

    handleToggleChange();
  }, [showShorter, fullResults, lastSearchTerm, searchTerm, hybridService]);

  useEffect(() => {
    const generation = ++searchGenerationRef.current;
    let cancelled = false;

    const searchAnagrams = async () => {
      // Detectar si es una búsqueda nueva
      if (searchTerm.trim() === lastSearchTerm.trim()) {
        return; // No es una búsqueda nueva, ya manejado por el efecto anterior
      }

      if (!searchTerm.trim()) {
        const emptyResults = {
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: [],
          patternMatches: []
        };
        setResults(emptyResults);
        setFullResults(emptyResults);
        setIsLoading(false);
        setError(null);
        setCurrentProvider('none');
        setLastSearchTerm('');
        return;
      }

      // Check if it's a pattern search first
      const isPatternSearch = searchTerm.includes('*') || 
                             searchTerm.includes('.') || 
                             searchTerm.includes('-') || 
                             searchTerm.includes(':') ||
                             searchTerm.includes('+') ||
                             searchTerm.includes('@') ||
                             searchTerm.includes('&') ||
                             /[+-]\d*[A-Za-z]/.test(searchTerm); // Numeric notation
      
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
        const trimmedTerm = searchTerm.trim();
        console.log(`🔍 Hybrid anagram search: "${trimmedTerm}"`);

        // Check if it's a pattern search
        const isPatternSearch = trimmedTerm.includes('*') || 
                               trimmedTerm.includes('.') || 
                               trimmedTerm.includes('-') || 
                               trimmedTerm.includes(':') ||
                               trimmedTerm.includes('+') ||
                               trimmedTerm.includes('@') ||
                               trimmedTerm.includes('&') ||
                               /[+-]\d*[A-Za-z]/.test(trimmedTerm); // Numeric notation

        // Check if it's a wildcard search (?)
        const isWildcardSearch = trimmedTerm.includes('?');
        const wildcardCount = (trimmedTerm.match(/\?/g) || []).length;


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

          // For patterns, use hybrid service with full fallback chain
          const patternMatches = await hybridService.findPatternMatches(cleanPattern, showShorter, 8, patternLength);
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
          
          setFullResults(patternResults);
          setResults(patternResults);
          setLastSearchTerm(trimmedTerm);
          console.log('✅ Setting loading to FALSE (pattern search)');
          setIsLoading(false);

        } else if (isWildcardSearch) {
          // 🎯 Wildcard anagram search (?)
          if (wildcardCount > 2) {
            throw new Error(`Máximo 2 comodines permitidos, encontrados: ${wildcardCount}`);
          }
          
          const wildcardResults = await hybridService.findAnagramsWithWildcards(trimmedTerm);
          if (cancelled || generation !== searchGenerationRef.current) return;
          
          // Ordenar palabras con letra adicional según la letra añadida
          const baseLetters = trimmedTerm.replace(/\?/g, ''); // Remover comodines para obtener letras base
          const sortedAdditionalMatches = sortWordsByAddedLetter(baseLetters, wildcardResults.additionalWildcardMatches);
          
          // Set provider based on what was actually used
          setCurrentProvider(hybridService.getCurrentProvider());
          
          // Para wildcards, los resultados son diferentes pero mantenemos cache
          const wildcardFullResults = {
            exactMatches: wildcardResults.exactMatches,
            wildcardMatches: wildcardResults.wildcardMatches,
            additionalWildcardMatches: sortedAdditionalMatches,
            shorterMatches: [], // Los wildcards no tienen subanagramas tradicionales
            patternMatches: []
          };
          setFullResults(wildcardFullResults);
          setResults(wildcardFullResults);
          setLastSearchTerm(trimmedTerm);
          console.log('✅ Setting loading to FALSE (wildcard search)');
          setIsLoading(false);

        } else {
          // Regular anagram search with hybrid fallback
          
          if (hybridService.isTrieAvailable()) {
            // Use Trie if available (ultra-fast, sync)
            setCurrentProvider('trie');
            
            const exactMatches = hybridService.findAnagrams(trimmedTerm);
            const additionalMatchesPromise = hybridService.findAnagramsWithOneAdditionalLetter(trimmedTerm);

            if (!showShorter && !cancelled && generation === searchGenerationRef.current) {
              const exactResults = {
                exactMatches,
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: [],
                patternMatches: []
              };
              setFullResults(exactResults);
              setResults(exactResults);
              setIsLoading(false);
            }

            const additionalWildcardMatches = sortWordsByAddedLetter(
              trimmedTerm,
              await additionalMatchesPromise
            );
            
            // Obtener subanagramas solo si showShorter está activo (optimización)
            let allShorterMatches: string[] = [];
            if (showShorter) {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(trimmedTerm, true);
              allShorterMatches = extendedResults.shorterMatches;
            }

            if (cancelled || generation !== searchGenerationRef.current) return;

            // Guardar TODOS los resultados en fullResults
            const allResults = {
              exactMatches,
              wildcardMatches: [],
              additionalWildcardMatches,
              shorterMatches: allShorterMatches,
              patternMatches: []
            };
            setFullResults(allResults);

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
            
            // setLastSearchTerm se ejecuta al final del bloque principal

          } else {
            // Use hybrid service async fallback (SQLite → Supabase)
            
            const exactMatchesPromise = hybridService.findAnagramsAsync(trimmedTerm);
            const additionalMatchesPromise = hybridService.findAnagramsWithOneAdditionalLetter(trimmedTerm);
            const exactMatches = await exactMatchesPromise;

            if (!showShorter && !cancelled && generation === searchGenerationRef.current) {
              const exactResults = {
                exactMatches,
                wildcardMatches: [],
                additionalWildcardMatches: [],
                shorterMatches: [],
                patternMatches: []
              };
              setFullResults(exactResults);
              setResults(exactResults);
              setIsLoading(false);
            }

            const additionalWildcardMatches = sortWordsByAddedLetter(
              trimmedTerm,
              await additionalMatchesPromise
            );
            
            // Obtener subanagramas solo si showShorter está activo (optimización)
            let allShorterMatches: string[] = [];
            if (showShorter) {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(trimmedTerm, true);
              allShorterMatches = extendedResults.shorterMatches;
            }

            if (cancelled || generation !== searchGenerationRef.current) return;

            // Set provider based on what was actually used
            setCurrentProvider(hybridService.getCurrentProvider());

            // Guardar TODOS los resultados en fullResults
            const allResults = {
              exactMatches,
              wildcardMatches: [],
              additionalWildcardMatches,
              shorterMatches: allShorterMatches,
              patternMatches: []
            };
            setFullResults(allResults);

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
          if (targetLength !== null) {
            setResults(prev => ({
              exactMatches: prev.exactMatches.filter(word => word.length === targetLength),
              wildcardMatches: prev.wildcardMatches.filter(word => word.length === targetLength),
              additionalWildcardMatches: prev.additionalWildcardMatches.filter(word => word.length === targetLength),
              shorterMatches: [], // Clear shorter when filtering by specific length
              patternMatches: prev.patternMatches.filter(word => word.length === targetLength)
            }));
          }
          
          setLastSearchTerm(trimmedTerm);
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
        setFullResults(errorResults);
        setCurrentProvider('none');
        console.log('❌ Setting loading to FALSE (error case)');
        setIsLoading(false);
      }
    };

    void searchAnagrams();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, targetLength, hybridService, lastSearchTerm, showShorter]);

  return {
    results,
    isLoading,
    error,
    currentProvider // Información adicional sobre qué servicio se está usando
  };
};
