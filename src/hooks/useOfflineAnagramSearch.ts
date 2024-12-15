import { useWordTrie } from "./useWordTrie";
import { useMemo } from "react";
import { processDigraphs, generateAlphagram } from "@/utils/digraphs";

export const useOfflineAnagramSearch = (searchTerm: string) => {
  // Get access to the Trie with memoized value to prevent unnecessary re-renders
  const { trie, isLoading, error } = useWordTrie();

  // Memoize the search results with optimized processing
  const results = useMemo(() => {
    if (!searchTerm || isLoading || error) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
    }

    // Pre-process input once for all operations
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    const lettersOnly = searchTerm.replace(/\*/g, '');
    const processedInput = processDigraphs(lettersOnly.toUpperCase());
    
    console.log('Offline search:', {
      searchTerm,
      wildcardCount,
      processedInput,
      timestamp: new Date().toISOString()
    });

    // Early return for empty input
    if (!processedInput) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
    }

    // Cache alphagram for non-wildcard searches
    const alphagram = wildcardCount === 0 ? generateAlphagram(processedInput) : null;

    // For non-wildcard searches, use optimized exact anagram matching
    if (wildcardCount === 0 && alphagram) {
      const startTime = performance.now();
      const exactMatches = trie.findAnagrams(alphagram);
      const endTime = performance.now();
      
      console.log('Exact matches found:', exactMatches.length, `(${(endTime - startTime).toFixed(2)}ms)`);
      
      return {
        exactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: []
      };
    }

    // For wildcard searches, use parallel processing when available
    const startTime = performance.now();
    
    // Get wildcard matches
    const wildcardMatches = wildcardCount > 0 
      ? trie.findWildcardMatches(processedInput, wildcardCount)
      : [];
    
    // Get additional wildcard matches only if we have initial wildcards
    const additionalWildcardMatches = wildcardCount > 0
      ? trie.findWildcardMatches(processedInput, wildcardCount + 1)
      : [];

    const endTime = performance.now();
    
    console.log('Search performance:', {
      wildcardMatches: wildcardMatches.length,
      additionalMatches: additionalWildcardMatches.length,
      timeMs: (endTime - startTime).toFixed(2)
    });

    return {
      exactMatches: [],
      wildcardMatches,
      additionalWildcardMatches
    };
  }, [searchTerm, trie, isLoading, error]);

  return {
    data: results,
    isLoading,
    error
  };
};