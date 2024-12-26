import { useWordTrie } from "./useWordTrie";
import { useMemo } from "react";
import { processDigraphs, getInternalLength } from "@/utils/digraphs";
import { MAX_WILDCARDS } from "./anagramSearch/constants";
import { SearchResults, SearchState } from "./anagramSearch/types";
import { 
  findExactMatches, 
  findWildcardMatches, 
  findAdditionalMatches,
  findShorterMatches 
} from "./anagramSearch/utils";
import { searchPattern } from "@/utils/trie/search";
import { wordTrie } from "@/utils/trie";

export const useOfflineAnagramSearch = (
  searchTerm: string, 
  showShorter: boolean = false,
  targetLength: number | null = null
): SearchState => {
  // Only use the loading state from the shared Trie
  const { isLoading, error } = useWordTrie();

  const results = useMemo(() => {
    if (!searchTerm || isLoading || error) {
      return { 
        exactMatches: [], 
        wildcardMatches: [], 
        additionalWildcardMatches: [],
        patternMatches: []
      };
    }

    // Check if this is a pattern search (contains ? or -)
    const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');
    
    if (isPatternSearch) {
      const patternMatches = searchPattern(wordTrie, searchTerm.toUpperCase());
      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: targetLength ? patternMatches.filter(word => getInternalLength(word) === targetLength) : patternMatches
      };
    }

    // Regular search
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    if (wildcardCount > MAX_WILDCARDS) {
      console.warn(`More than ${MAX_WILDCARDS} wildcards detected. Only the first ${MAX_WILDCARDS} will be considered.`);
      return { 
        exactMatches: [], 
        wildcardMatches: [], 
        additionalWildcardMatches: [], 
        patternMatches: [] 
      };
    }

    // First process digraphs, then handle wildcards
    const processedSearch = processDigraphs(searchTerm.toUpperCase());
    const processedInput = processedSearch.replace(/\*/g, '');

    if (!processedInput) {
      return { 
        exactMatches: [], 
        wildcardMatches: [], 
        additionalWildcardMatches: [], 
        patternMatches: [] 
      };
    }

    const startTime = performance.now();
    let results: SearchResults;

    // Filter function for exact length matches using internal length
    const filterByLength = (words: string[]) => {
      if (!targetLength) return words;
      return words.filter(word => getInternalLength(word) === targetLength);
    };

    // Handle shorter words mode
    if (showShorter) {
      const shorterMatches = Array.from(findShorterMatches(processedInput));
      const filteredMatches = targetLength 
        ? shorterMatches.filter(word => getInternalLength(word) === targetLength)
        : shorterMatches;
      
      results = {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: filteredMatches,
        patternMatches: []
      };
    } else if (wildcardCount === 0) {
      // For exact matches
      const exactMatches = Array.from(findExactMatches(processedInput));
      const filteredExactMatches = filterByLength(exactMatches);
      const additionalMatches = targetLength 
        ? Array.from(findAdditionalMatches(processedInput, 0)).filter(word => getInternalLength(word) === targetLength)
        : Array.from(findAdditionalMatches(processedInput, 0));
      
      results = {
        exactMatches: filteredExactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: additionalMatches,
        patternMatches: []
      };
    } else {
      // For wildcard matches
      const wildcardMatches = Array.from(findWildcardMatches(processedInput, wildcardCount));
      const filteredWildcardMatches = filterByLength(wildcardMatches);
      const additionalMatches = targetLength 
        ? Array.from(findAdditionalMatches(processedInput, wildcardCount)).filter(word => getInternalLength(word) === targetLength)
        : Array.from(findAdditionalMatches(processedInput, wildcardCount));
      
      results = {
        exactMatches: [],
        wildcardMatches: filteredWildcardMatches,
        additionalWildcardMatches: additionalMatches,
        patternMatches: []
      };
    }

    const endTime = performance.now();
    console.log('Search performance:', {
      input: processedInput,
      exactMatches: results.exactMatches.length,
      wildcardMatches: results.wildcardMatches.length,
      additionalMatches: results.additionalWildcardMatches.length,
      patternMatches: results.patternMatches.length,
      timeMs: (endTime - startTime).toFixed(2),
      targetLength,
      showShorter
    });

    return results;
  }, [searchTerm, trie, isLoading, error, showShorter, targetLength]);

  return {
    data: results,
    isLoading,
    error
  };
};
