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
      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: []
      };
    }

    const { exactMatches, wildcardMatches, additionalWildcardMatches } = findAnagrams(
      searchTerm,
      showShorter,
      targetLength,
      trie
    );

    const patternMatches = findPatternMatches(searchTerm, trie);

    return {
      exactMatches,
      wildcardMatches,
      additionalWildcardMatches,
      patternMatches
    };
  }, [searchTerm, showShorter, targetLength, trie]);

  return {
    data: results,
    isLoading: false
  };
};