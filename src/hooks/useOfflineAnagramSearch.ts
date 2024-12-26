import { useMemo } from "react";
import { findAnagramsUtil } from "@/hooks/anagramSearch/utils";
import { findPatternMatches } from "@/utils/patternMatching";
import { Trie } from "@/utils/trie/types";
import { SearchResults } from "./anagramSearch/types";

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
        shorterMatches: [],
        patternMatches: []
      } as SearchResults;
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
        shorterMatches: [],
        patternMatches: matches
      } as SearchResults;
    }

    // Regular anagram search
    const { exactMatches, wildcardMatches, additionalWildcardMatches, shorterMatches } = findAnagramsUtil(searchTerm, trie, true);

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
        shorterMatches: [],
        patternMatches: []
      } as SearchResults;
    }

    // Return results based on showShorter toggle
    if (showShorter) {
      // When toggle is ON, show only shorter matches
      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        shorterMatches,
        patternMatches: []
      } as SearchResults;
    } else {
      // When toggle is OFF, show only full-length and additional letter matches
      return {
        exactMatches,
        wildcardMatches,
        additionalWildcardMatches,
        shorterMatches: [],
        patternMatches: []
      } as SearchResults;
    }
  }, [searchTerm, showShorter, targetLength, trie]);

  return {
    data: results,
    isLoading: false
  };
};