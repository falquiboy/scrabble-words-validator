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

export const useOfflineAnagramSearch = (
  searchTerm: string, 
  showShorter: boolean = false,
  targetLength: number | null = null
): SearchState => {
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
        patternMatches: targetLength ? patternMatches.filter(word => word.length === targetLength) : patternMatches
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

    // Filter function for exact length matches
    const filterByExactLength = (words: string[]) => 
      targetLength ? words.filter(word => word.length === targetLength) : words;

    // Filter function for shorter words - only show words shorter than target length
    const filterShorterWords = (words: string[]) => {
      if (!targetLength) return words;
      return words.filter(word => word.length < targetLength);
    };

    // Handle shorter words mode
    if (showShorter) {
      const shorterMatches = Array.from(findShorterMatches(processedInput));
      results = {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: targetLength ? filterShorterWords(shorterMatches) : shorterMatches,
        patternMatches: []
      };
    } else if (wildcardCount === 0) {
      // For exact matches
      const exactMatches = Array.from(findExactMatches(processedInput));
      const additionalMatches = Array.from(findAdditionalMatches(processedInput, 0));
      results = {
        exactMatches: filterByExactLength(exactMatches),
        wildcardMatches: [],
        additionalWildcardMatches: targetLength ? [] : additionalMatches, // Only show additional matches if no target length
        patternMatches: []
      };
    } else {
      // For wildcard matches
      const wildcardMatches = Array.from(findWildcardMatches(processedInput, wildcardCount));
      const additionalMatches = Array.from(findAdditionalMatches(processedInput, wildcardCount));
      results = {
        exactMatches: [],
        wildcardMatches: filterByExactLength(wildcardMatches),
        additionalWildcardMatches: targetLength ? [] : additionalMatches, // Only show additional matches if no target length
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