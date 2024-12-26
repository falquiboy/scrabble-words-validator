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
    const { exactMatches, wildcardMatches, additionalWildcardMatches } = findAnagrams(searchTerm, trie);
    console.log('Anagram search results:', { 
      exactMatches, 
      wildcardMatches, 
      additionalWildcardMatches, 
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

    // Return all results if showShorter is true, otherwise exclude additionalWildcardMatches
    return {
      exactMatches,
      wildcardMatches,
      additionalWildcardMatches: showShorter ? additionalWildcardMatches : [],
      patternMatches: []
    };
  }, [searchTerm, showShorter, targetLength, trie]);

  return {
    data: results,
    isLoading: false
  };
};