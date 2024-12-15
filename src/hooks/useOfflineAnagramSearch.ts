import { useWordTrie } from "./useWordTrie";
import { useMemo } from "react";
import { processDigraphs, generateAlphagram } from "@/utils/digraphs";

// Spanish alphabet including digraphs (using internal representation)
const SPANISH_LETTERS = ["A", "B", "C", "Ç", "D", "E", "F", "G", "H", "I", "J", "L", "K", "M", "N", "Ñ", "O", "P", "Q", "R", "W", "S", "T", "U", "V", "X", "Y", "Z"];

export const useOfflineAnagramSearch = (searchTerm: string) => {
  const { trie, isLoading, error } = useWordTrie();

  const results = useMemo(() => {
    if (!searchTerm || isLoading || error) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
    }

    // Pre-process input
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;
    if (wildcardCount > 2) {
      console.warn('More than 2 wildcards detected. Only the first 2 will be considered.');
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
    }

    const lettersOnly = searchTerm.replace(/\*/g, '');
    const processedInput = processDigraphs(lettersOnly.toUpperCase());
    const baseLength = processedInput.length;
    
    console.log('Offline search:', {
      searchTerm,
      wildcardCount,
      processedInput,
      baseLength,
      timestamp: new Date().toISOString()
    });

    // Early return for empty input
    if (!processedInput) {
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
    }

    // For non-wildcard searches, use exact matching
    if (wildcardCount === 0) {
      const alphagram = generateAlphagram(processedInput);
      const startTime = performance.now();
      const exactMatches = trie.findAnagrams(alphagram);
      const endTime = performance.now();
      
      console.log('Exact matches found:', exactMatches.length, `(${(endTime - startTime).toFixed(2)}ms)`);
      
      // Find words that can be formed with one additional letter
      const additionalMatches = new Set<string>();
      for (const letter of SPANISH_LETTERS) {
        const newAlphagram = generateAlphagram(processedInput + letter);
        const matches = trie.findAnagrams(newAlphagram);
        matches.forEach(match => additionalMatches.add(match));
      }

      return {
        exactMatches,
        wildcardMatches: [],
        additionalWildcardMatches: Array.from(additionalMatches)
      };
    }

    // For wildcard searches
    const startTime = performance.now();
    const wildcardResults = new Set<string>();
    const additionalResults = new Set<string>();

    // Function to generate all possible combinations with wildcards
    const generateWildcardCombinations = (base: string, remainingWildcards: number): string[] => {
      if (remainingWildcards === 0) return [base];
      
      const combinations: string[] = [];
      for (const letter of SPANISH_LETTERS) {
        const newBase = base + letter;
        combinations.push(...generateWildcardCombinations(newBase, remainingWildcards - 1));
      }
      return combinations;
    };

    // Generate all possible combinations with the wildcards
    const combinations = generateWildcardCombinations(processedInput, wildcardCount);
    
    // Find matches for each combination
    for (const combo of combinations) {
      const alphagram = generateAlphagram(combo);
      const matches = trie.findAnagrams(alphagram);
      matches.forEach(match => wildcardResults.add(match));

      // Find additional matches with one more letter
      for (const letter of SPANISH_LETTERS) {
        const newAlphagram = generateAlphagram(combo + letter);
        const additionalMatches = trie.findAnagrams(newAlphagram);
        additionalMatches.forEach(match => additionalResults.add(match));
      }
    }

    const endTime = performance.now();
    
    console.log('Search performance:', {
      wildcardMatches: wildcardResults.size,
      additionalMatches: additionalResults.size,
      timeMs: (endTime - startTime).toFixed(2)
    });

    return {
      exactMatches: [],
      wildcardMatches: Array.from(wildcardResults),
      additionalWildcardMatches: Array.from(additionalResults)
    };
  }, [searchTerm, trie, isLoading, error]);

  return {
    data: results,
    isLoading,
    error
  };
};