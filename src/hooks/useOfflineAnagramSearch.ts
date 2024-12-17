import { useWordTrie } from "./useWordTrie";
import { useMemo } from "react";
import { processDigraphs } from "@/utils/digraphs";
import { MAX_WILDCARDS } from "./anagramSearch/constants";
import { SearchResults, SearchState } from "./anagramSearch/types";
import { 
  findExactMatches, 
  findWildcardMatches, 
  findAdditionalMatches,
  findShorterWords
} from "./anagramSearch/utils";
import { searchPattern } from "@/utils/trie/search";

export const useOfflineAnagramSearch = (searchTerm: string): SearchState => {
  const { trie, isLoading, error: trieError } = useWordTrie();

  const results = useMemo(() => {
    if (!searchTerm || isLoading || trieError) {
      return { 
        exactMatches: [], 
        wildcardMatches: [], 
        additionalWildcardMatches: [], 
        patternMatches: [],
        shorterMatches: new Map()
      };
    }

    // Check if this is a pattern search
    const isPatternSearch = searchTerm.includes('/');
    
    if (isPatternSearch) {
      const [pattern, rackLetters] = searchTerm.split('/').map(s => s.trim().toUpperCase());
      
      if (!pattern || !rackLetters) {
        return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [], shorterMatches: new Map() };
      }

      const processedPattern = processDigraphs(pattern);
      const processedRack = processDigraphs(rackLetters);
      
      const potentialMatches = trie.getWordsOfLength(processedPattern.length);
      const patternMatches = searchPattern(potentialMatches, processedPattern, processedRack);

      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: Array.from(new Set(patternMatches)),
        shorterMatches: new Map()
      };
    }

    // Regular search
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    if (wildcardCount > MAX_WILDCARDS) {
      console.warn(`More than ${MAX_WILDCARDS} wildcards detected. Only the first ${MAX_WILDCARDS} will be considered.`);
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [], shorterMatches: new Map() };
    }

    const processedInput = processDigraphs(searchTerm.replace(/\*/g, '').toUpperCase());
    if (!processedInput) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], patternMatches: [], shorterMatches: new Map() };
    }

    const startTime = performance.now();
    let results: SearchResults;

    if (wildcardCount === 0) {
      const exactMatches = Array.from(findExactMatches(processedInput));
      const additionalMatches = Array.from(findAdditionalMatches(processedInput));
      
      // Only search for shorter words if no exact or additional matches were found
      const shorterMatches = (exactMatches.length === 0 && additionalMatches.length === 0) 
        ? findShorterWords(processedInput)
        : new Map();

      results = {
        exactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: additionalMatches,
        patternMatches: [],
        shorterMatches
      };
    } else {
      const wildcardMatches = Array.from(findWildcardMatches(processedInput, wildcardCount));
      const additionalMatches = Array.from(findAdditionalMatches(processedInput));
      
      // Only search for shorter words if no wildcard or additional matches were found
      const shorterMatches = (wildcardMatches.length === 0 && additionalMatches.length === 0)
        ? findShorterWords(processedInput)
        : new Map();

      results = {
        exactMatches: [],
        wildcardMatches,
        additionalWildcardMatches: additionalMatches,
        patternMatches: [],
        shorterMatches
      };
    }

    const endTime = performance.now();
    console.log('Search performance:', {
      exactMatches: results.exactMatches.length,
      wildcardMatches: results.wildcardMatches.length,
      additionalMatches: results.additionalWildcardMatches.length,
      shorterMatches: Array.from(results.shorterMatches.entries()).reduce((acc, [_, words]) => acc + words.size, 0),
      timeMs: (endTime - startTime).toFixed(2)
    });

    return results;
  }, [searchTerm, trie, isLoading, trieError]);

  return {
    data: results,
    isLoading,
    error: trieError ? new Error(String(trieError)) : null
  };
};