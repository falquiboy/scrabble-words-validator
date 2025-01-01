import { useState, useEffect } from "react";
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
  
  if (!searchTerm || !trie) {
    console.log('No search term or trie not ready:', { searchTerm, trieExists: !!trie });
    return {
      data: {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        shorterMatches: [],
        patternMatches: []
      },
      isLoading: false
    };
  }

  // Check if it's a pattern search
  const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');
  
  if (isPatternSearch) {
    console.log('Executing pattern search for:', searchTerm);
    const matches = await findPatternMatches(searchTerm, trie);
    console.log('Pattern search results:', matches);
    return {
      data: {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        shorterMatches: [],
        patternMatches: matches
      },
      isLoading: false
    };
  }

  // Regular anagram search
  const { exactMatches, wildcardMatches, additionalWildcardMatches, shorterMatches } = findAnagrams(searchTerm, trie, showShorter);

  // Filter by target length if specified
  if (targetLength !== null) {
    return {
      data: {
        exactMatches: exactMatches.filter(word => word.length === targetLength),
        wildcardMatches: wildcardMatches.filter(word => word.length === targetLength),
        additionalWildcardMatches: additionalWildcardMatches.filter(word => word.length === targetLength),
        shorterMatches: [],
        patternMatches: []
      },
      isLoading: false
    };
  }

  // Return all results, including shorter matches if showShorter is true
  return {
    data: {
      exactMatches,
      wildcardMatches,
      additionalWildcardMatches,
      shorterMatches: showShorter ? shorterMatches : [],
      patternMatches: []
    },
    isLoading: false
  };
};