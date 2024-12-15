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

    const startTime = performance.now();
    const exactMatches = new Set<string>();
    const wildcardMatches = new Set<string>();
    const additionalMatches = new Set<string>();

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

    // Handle base search (with or without wildcards)
    if (wildcardCount === 0) {
      // For non-wildcard searches, use exact matching
      const alphagram = generateAlphagram(processedInput);
      const matches = trie.findAnagrams(alphagram);
      matches.forEach(match => exactMatches.add(match));
    } else {
      // Generate all possible combinations with the wildcards
      const combinations = generateWildcardCombinations(processedInput, wildcardCount);
      for (const combo of combinations) {
        const alphagram = generateAlphagram(combo);
        const matches = trie.findAnagrams(alphagram);
        matches.forEach(match => wildcardMatches.add(match));
      }
    }

    // Always search for additional letter combinations
    // For the base letters (without wildcards)
    const baseForAdditional = processedInput;
    for (const letter of SPANISH_LETTERS) {
      const newBase = baseForAdditional + letter;
      const alphagram = generateAlphagram(newBase);
      const matches = trie.findAnagrams(alphagram);
      matches.forEach(match => additionalMatches.add(match));
    }

    // If we have wildcards, also search additional combinations
    if (wildcardCount > 0) {
      const wildcardCombos = generateWildcardCombinations(processedInput, wildcardCount);
      for (const combo of wildcardCombos) {
        for (const letter of SPANISH_LETTERS) {
          const newCombo = combo + letter;
          const alphagram = generateAlphagram(newCombo);
          const matches = trie.findAnagrams(alphagram);
          matches.forEach(match => additionalMatches.add(match));
        }
      }
    }

    const endTime = performance.now();
    
    console.log('Search performance:', {
      exactMatches: exactMatches.size,
      wildcardMatches: wildcardMatches.size,
      additionalMatches: additionalMatches.size,
      timeMs: (endTime - startTime).toFixed(2)
    });

    return {
      exactMatches: Array.from(exactMatches),
      wildcardMatches: Array.from(wildcardMatches),
      additionalWildcardMatches: Array.from(additionalMatches)
    };
  }, [searchTerm, trie, isLoading, error]);

  return {
    data: results,
    isLoading,
    error
  };
};