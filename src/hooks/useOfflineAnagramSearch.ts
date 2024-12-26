import { useMemo } from "react";
import { findAnagrams } from "@/hooks/anagramSearch/utils";
import { findPatternMatches } from "@/utils/patternMatching";
import { Trie } from "@/utils/trie/types";

export const useOfflineAnagramSearch = (
  searchTerm: string,
  showShorter: boolean,
  targetLength: number | null,
  trie: Trie
) => {
  const results = useMemo(() => {
    if (!searchTerm || !trie) {
      console.log('No search term or trie not ready:', { searchTerm, trieExists: !!trie });
      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: []
      };
    }

    // Check if it's a pattern search
    const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');
    
    if (isPatternSearch) {
      const matches = findPatternMatches(searchTerm, trie);
      console.log('Pattern search results:', matches);
      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: matches
      };
    }

    // Regular anagram search
    const { exactMatches, wildcardMatches, additionalWildcardMatches, shorterMatches } = findAnagrams(searchTerm, trie, showShorter);
    console.log('Anagram search results:', { 
      exactMatches, 
      wildcardMatches, 
      additionalWildcardMatches,
      shorterMatches,
      showShorter,
      targetLength 
    });

    // Filter by target length if specified
    if (targetLength !== null) {
      return {
        exactMatches: exactMatches.filter(word => word.length === targetLength),
        wildcardMatches: wildcardMatches.filter(word => word.length === targetLength),
        additionalWildcardMatches: additionalWildcardMatches.filter(word => word.length === targetLength),
        patternMatches: []
      };
    }

    // Return all results, including shorter matches if showShorter is true
    return {
      exactMatches,
      wildcardMatches,
      additionalWildcardMatches,
      shorterMatches: showShorter ? shorterMatches : [],
      patternMatches: []
    };
  }, [searchTerm, showShorter, targetLength, trie]);

  return {
    data: results,
    isLoading: false
  };
};