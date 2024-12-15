import { useWordTrie } from "./useWordTrie";
import { useMemo } from "react";
import { processDigraphs, generateAlphagram } from "@/utils/digraphs";

export const useOfflineAnagramSearch = (searchTerm: string) => {
  // Get access to the Trie
  const { trie, isLoading, error } = useWordTrie();

  // Memoize the search results
  const results = useMemo(() => {
    if (!searchTerm || isLoading || error) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
    }

    // Count wildcards and process input
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    const lettersOnly = searchTerm.replace(/\*/g, '');
    const processedInput = processDigraphs(lettersOnly.toUpperCase());
    
    console.log('Offline search:', {
      searchTerm,
      wildcardCount,
      processedInput
    });

    // For non-wildcard searches, use exact anagram matching
    if (wildcardCount === 0) {
      const alphagram = generateAlphagram(processedInput);
      const exactMatches = trie.findAnagrams(alphagram);
      console.log('Exact matches found:', exactMatches.length);
      return {
        exactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: []
      };
    }

    // For wildcard searches
    const wildcardMatches = trie.findWildcardMatches(processedInput, wildcardCount);
    console.log('Wildcard matches found:', wildcardMatches.length);

    // For additional wildcard matches (one more wildcard)
    const additionalWildcardMatches = trie.findWildcardMatches(processedInput, wildcardCount + 1);
    console.log('Additional wildcard matches found:', additionalWildcardMatches.length);

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