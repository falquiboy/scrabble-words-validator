/**
 * Hook híbrido para anagramas: IndexedDB (inmediato) → Trie (cuando esté listo)
 * Reemplaza useOfflineAnagramSearch con fallback verdadero
 */

import { useState, useEffect } from 'react';
// import { indexedDbAnagramService } from '@/services/IndexedDbAnagramService'; // Deprecated - using hybrid service
import { findPatternMatches } from "@/utils/pattern/matching";
import { HybridTrieService } from '@/services/HybridTrieService';
import { SearchResults } from "./anagramSearch/types";
import { sortWordsByAddedLetter } from "@/utils/additionalLetterSort";

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
  const [currentProvider, setCurrentProvider] = useState<'none' | 'indexeddb' | 'trie'>('none');
  const [lastSearchTerm, setLastSearchTerm] = useState<string>('');

  // Efecto para cambios en el toggle (con carga lazy de subanagramas)
  useEffect(() => {
    const handleToggleChange = async () => {
      if (lastSearchTerm === searchTerm && searchTerm.trim() && 
          (fullResults.exactMatches.length > 0 || fullResults.wildcardMatches.length > 0 || fullResults.patternMatches.length > 0)) {
        
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

      // Validación de longitud mínima (2 letras sin contar comodines ni patrones)
      const lettersOnly = searchTerm.replace(/[\?\*\.\-\:]/g, '');
      if (lettersOnly.length < 2) {
        setResults({
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: [],
          patternMatches: []
        });
        setIsLoading(false);
        setError('Mínimo 2 letras requeridas');
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

        } else if (isWildcardSearch) {
          // 🎯 Wildcard anagram search (?)
          if (wildcardCount > 2) {
            throw new Error(`Máximo 2 comodines permitidos, encontrados: ${wildcardCount}`);
          }
          
          const wildcardResults = await hybridService.findAnagramsWithWildcards(trimmedTerm);
          
          // Ordenar palabras con letra adicional según la letra añadida
          const baseLetters = trimmedTerm.replace(/\?/g, ''); // Remover comodines para obtener letras base
          const sortedAdditionalMatches = sortWordsByAddedLetter(baseLetters, wildcardResults.additionalWildcardMatches);
          
          // Set provider based on what was actually used
          setCurrentProvider(hybridService.getCurrentProvider() as any);
          
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

        } else {
          // Regular anagram search with hybrid fallback
          
          if (hybridService.isTrieAvailable()) {
            // Use Trie if available (ultra-fast, sync)
            setCurrentProvider('trie');
            
            const exactMatches = hybridService.findAnagrams(trimmedTerm);
            
            // For palabras con letra adicional, use 1 wildcard search
            const additionalResults = await hybridService.findAnagramsWithWildcards(trimmedTerm + '?');
            const additionalWildcardMatches = sortWordsByAddedLetter(trimmedTerm, additionalResults.wildcardMatches);
            
            // Obtener subanagramas solo si showShorter está activo (optimización)
            let allShorterMatches: string[] = [];
            if (showShorter) {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(trimmedTerm, true);
              allShorterMatches = extendedResults.shorterMatches;
            }

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

          } else {
            // Use hybrid service async fallback (SQLite → Supabase)
            
            const exactMatches = await hybridService.findAnagramsAsync(trimmedTerm);
            
            // For palabras con letra adicional, use 1 wildcard search
            const additionalResults = await hybridService.findAnagramsWithWildcards(trimmedTerm + '?');
            const additionalWildcardMatches = sortWordsByAddedLetter(trimmedTerm, additionalResults.wildcardMatches);
            
            // Obtener subanagramas solo si showShorter está activo (optimización)
            let allShorterMatches: string[] = [];
            if (showShorter) {
              const extendedResults = await hybridService.findAnagramsWithSubAnagrams(trimmedTerm, true);
              allShorterMatches = extendedResults.shorterMatches;
            }

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

        // Actualizar término de búsqueda para cache
        setLastSearchTerm(trimmedTerm);

      } catch (err) {
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
      } finally {
        setIsLoading(false);
      }
    };

    searchAnagrams();
  }, [searchTerm, targetLength, hybridService]); // Remover showShorter de dependencias

  return {
    results,
    isLoading,
    error,
    currentProvider // Información adicional sobre qué servicio se está usando
  };
};