import { useMemo } from "react";
import { findAnagrams } from "@/hooks/anagramSearch/utils";
import { findPatternMatches } from "@/utils/pattern/matching";
import { Trie } from "@/utils/trie/types";
import { SearchResults } from "./anagramSearch/types";

export const useOfflineAnagramSearch = async (
  searchTerm: string,
  showShorter: boolean,
  targetLength: number | null,
  trie: Trie
): Promise<{ data: SearchResults; isLoading: boolean }> => {
  console.log('Starting search with:', { searchTerm, showShorter, targetLength });
  
  const results = await useMemo(async () => {
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
      console.log('Executing pattern search for:', searchTerm);
      const matches = await findPatternMatches(searchTerm, trie);
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
    const { exactMatches, wildcardMatches, additionalWildcardMatches, shorterMatches } = findAnagrams(searchTerm, trie, true);

    // Filter by target length if specified
    if (targetLength !== null) {
      // Remove the length filter from the search term for comparison
      const lettersOnly = searchTerm.replace(/\/\d+$/, '');
      
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