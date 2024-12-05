import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, generateAlphagram, toDisplayFormat } from "@/utils/digraphs";
import { useMemo } from "react";

// Spanish alphabet including digraphs in specified order
const SPANISH_LETTERS = ["A", "B", "C", "Ç", "CH", "D", "E", "F", "G", "H", "I", "J", "K", "L", "LL", "M", "N", "Ñ", "O", "P", "Q", "R", "RR", "S", "T", "U", "V", "W", "X", "Y", "Z"];

// Maximum number of combinations to try
const MAX_COMBINATIONS = 500;

export const useAnagramSearch = (searchTerm: string) => {
  // Memoize the initial processing of the search term
  const { wildcardCount, processedInput, targetAlphagram, inputLength } = useMemo(() => {
    const count = (searchTerm.match(/\*/g) || []).length;
    const lettersOnly = searchTerm.replace(/\*/g, '');
    const processed = processDigraphs(lettersOnly);
    return {
      wildcardCount: count,
      processedInput: processed,
      targetAlphagram: generateAlphagram(processed),
      inputLength: processed.length
    };
  }, [searchTerm]);

  return useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
      
      console.log('Search term:', searchTerm, 'Wildcard count:', wildcardCount);

      // Query exact matches first (when no wildcards)
      let exactMatches: string[] = [];
      if (wildcardCount === 0) {
        const { data: exactData, error: exactError } = await supabase
          .from("words")
          .select("word")
          .eq('lenght', inputLength)
          .eq('alphagram', targetAlphagram);

        if (exactError) {
          console.error("Supabase error (exact):", exactError);
        } else {
          exactMatches = exactData?.map(d => toDisplayFormat(d.word)) || [];
        }
      }

      // For wildcard searches, we need to try all possible letter combinations
      let wildcardMatches: string[] = [];
      let additionalWildcardMatches: string[] = [];
      
      if (wildcardCount > 0) {
        // Generate combinations more efficiently
        const generateCombinations = (depth: number): string[] => {
          if (depth === 0) return [''];
          
          const results: string[] = [];
          const previousCombinations = generateCombinations(depth - 1);
          
          for (const prev of previousCombinations) {
            for (const letter of SPANISH_LETTERS) {
              if (results.length >= MAX_COMBINATIONS) return results;
              results.push(prev + letter);
            }
          }
          return results;
        };

        // Get combinations for current wildcard count
        const possibleCombinations = generateCombinations(wildcardCount).slice(0, MAX_COMBINATIONS);
        console.log(`Generated ${possibleCombinations.length} combinations for current wildcards`);

        // Batch the combinations into groups of 10 for fewer database calls
        const batchSize = 10;
        for (let i = 0; i < possibleCombinations.length; i += batchSize) {
          const batch = possibleCombinations.slice(i, i + batchSize);
          const alphagrams = batch.map(combo => generateAlphagram(processedInput + combo));
          
          const { data, error } = await supabase
            .from("words")
            .select("word")
            .eq('lenght', inputLength + wildcardCount)
            .in('alphagram', alphagrams);

          if (error) {
            console.error(`Supabase error for batch ${i}:`, error);
            continue;
          }

          if (data) {
            wildcardMatches.push(...data.map(d => toDisplayFormat(d.word)));
          }
        }

        // Only generate additional wildcard matches if we haven't hit our limit
        if (wildcardMatches.length < MAX_COMBINATIONS) {
          const additionalCombinations = generateCombinations(wildcardCount + 1)
            .slice(0, MAX_COMBINATIONS - wildcardMatches.length);
          
          // Batch these combinations as well
          for (let i = 0; i < additionalCombinations.length; i += batchSize) {
            const batch = additionalCombinations.slice(i, i + batchSize);
            const alphagrams = batch.map(combo => generateAlphagram(processedInput + combo));
            
            const { data, error } = await supabase
              .from("words")
              .select("word")
              .eq('lenght', inputLength + wildcardCount + 1)
              .in('alphagram', alphagrams);

            if (error) {
              console.error(`Supabase error for additional batch ${i}:`, error);
              continue;
            }

            if (data) {
              additionalWildcardMatches.push(...data.map(d => toDisplayFormat(d.word)));
            }
          }
        }

        // Remove duplicates
        wildcardMatches = Array.from(new Set(wildcardMatches));
        additionalWildcardMatches = Array.from(new Set(additionalWildcardMatches));
      }

      console.log('Results count:', {
        exact: exactMatches.length,
        wildcard: wildcardMatches.length,
        additional: additionalWildcardMatches.length
      });
      
      return {
        exactMatches,
        wildcardMatches,
        additionalWildcardMatches
      };
    },
    enabled: Boolean(searchTerm)
  });
};