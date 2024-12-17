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

    // Check if this is a pattern search
    const isPatternSearch = searchTerm.includes('/');
    
    if (isPatternSearch) {
      const [pattern, rackLetters] = searchTerm.split('/').map(s => s.trim().toUpperCase());
      
      if (!pattern || !rackLetters) {
        return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [] };
      }

      const processedPattern = processDigraphs(pattern);
      const processedRack = processDigraphs(rackLetters);
      
      const potentialMatches = trie.getWordsOfLength(processedPattern.length);
      const patternMatches = searchPattern(potentialMatches, processedPattern, processedRack);

      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: Array.from(new Set(patternMatches))
      };
    }

    // Regular search
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    if (wildcardCount > MAX_WILDCARDS) {
      console.warn(`More than ${MAX_WILDCARDS} wildcards detected. Only the first ${MAX_WILDCARDS} will be considered.`);
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [] };
    }

    const processedInput = processDigraphs(searchTerm.replace(/\*/g, '').toUpperCase());
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
      results = {
        exactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: []
      };
    } else {
      const wildcardMatches = Array.from(findWildcardMatches(processedInput, wildcardCount));
      results = {
        exactMatches: [],
        wildcardMatches,
        additionalWildcardMatches: [],
        patternMatches: []
      };
    }

    const endTime = performance.now();
    console.log('Search performance:', {
      exactMatches: results.exactMatches.length,
      wildcardMatches: results.wildcardMatches.length,
      additionalMatches: results.additionalWildcardMatches.length,
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