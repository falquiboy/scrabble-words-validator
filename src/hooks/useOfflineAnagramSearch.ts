import { useWordTrie } from "./useWordTrie";
import { useMemo } from "react";
import { processDigraphs } from "@/utils/digraphs";
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

export const useOfflineAnagramSearch = (searchTerm: string, showShorter: boolean = false): SearchState => {
  const { trie, isLoading, error } = useWordTrie();

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
        patternMatches
      };
    }

    // Regular search
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    if (wildcardCount > MAX_WILDCARDS) {
      console.warn(`More than ${MAX_WILDCARDS} wildcards detected. Only the first ${MAX_WILDCARDS} will be considered.`);
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [] };
    }

    // First process digraphs, then handle wildcards
    const processedSearch = processDigraphs(searchTerm.toUpperCase());
    const processedInput = processedSearch.replace(/\*/g, '');

    if (!processedInput) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [] };
    }

    const startTime = performance.now();
    let results: SearchResults;

    // Handle shorter words mode
    if (showShorter) {
      const shorterMatches = Array.from(findShorterMatches(processedInput));
      results = {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: shorterMatches,
        patternMatches: []
      };
    } else if (wildcardCount === 0) {
      const exactMatches = Array.from(findExactMatches(processedInput));
      const additionalMatches = Array.from(findAdditionalMatches(processedInput, 0));
      results = {
        exactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: additionalMatches,
        patternMatches: []
      };
    } else {
      const wildcardMatches = Array.from(findWildcardMatches(processedInput, wildcardCount));
      const additionalMatches = Array.from(findAdditionalMatches(processedInput, wildcardCount));
      results = {
        exactMatches: [],
        wildcardMatches,
        additionalWildcardMatches: additionalMatches,
        patternMatches: []
      };
    }

    const endTime = performance.now();
    console.log('Search performance:', {
      exactMatches: results.exactMatches.length,
      wildcardMatches: results.wildcardMatches.length,
      additionalMatches: results.additionalWildcardMatches.length,
      patternMatches: results.patternMatches.length,
      timeMs: (endTime - startTime).toFixed(2)
    });

    return results;
  }, [searchTerm, trie, isLoading, error, showShorter]);

  return {
    data: results,
    isLoading,
    error
  };
};