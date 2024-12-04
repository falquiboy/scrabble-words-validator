import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, generateAlphagram, toDisplayFormat } from "@/utils/digraphs";

// Spanish alphabet including digraphs in specified order
const SPANISH_LETTERS = ["A", "B", "C", "Ç", "CH", "D", "E", "F", "G", "H", "I", "J", "K", "L", "LL", "M", "N", "Ñ", "O", "P", "Q", "R", "RR", "S", "T", "U", "V", "W", "X", "Y", "Z"];

export const useAnagramSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { exactMatches: [], wildcardMatches: [] };
      
      console.log('Search term:', searchTerm);
      
      // Count wildcards and get base letters
      const wildcardCount = (searchTerm.match(/\*/g) || []).length;
      const lettersOnly = searchTerm.replace(/\*/g, '');
      console.log('Wildcard count:', wildcardCount, 'Letters only:', lettersOnly);
      
      // Process input with digraphs and generate alphagram
      const processedInput = processDigraphs(lettersOnly);
      const targetAlphagram = generateAlphagram(processedInput);
      const inputLength = processedInput.length;
      
      console.log('Processed input:', processedInput, 'Target alphagram:', targetAlphagram);

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
      if (wildcardCount > 0) {
        // Generate all possible combinations for the wildcard positions
        const generateCombinations = (current: string[], depth: number): string[] => {
          if (depth === 0) {
            return [current.join('')];
          }
          
          const results: string[] = [];
          for (const letter of SPANISH_LETTERS) {
            results.push(...generateCombinations([...current, letter], depth - 1));
          }
          return results;
        };

        // Generate all possible combinations for the wildcards
        const possibleCombinations = generateCombinations([], wildcardCount);
        console.log(`Generated ${possibleCombinations.length} possible combinations`);

        // Try each combination
        for (const combination of possibleCombinations) {
          const testWord = processedInput + combination;
          const testAlphagram = generateAlphagram(testWord);
          
          const { data, error } = await supabase
            .from("words")
            .select("word")
            .eq('lenght', inputLength + wildcardCount)
            .eq('alphagram', testAlphagram);

          if (error) {
            console.error(`Supabase error for combination ${combination}:`, error);
            continue;
          }

          if (data) {
            wildcardMatches.push(...data.map(d => toDisplayFormat(d.word)));
          }
        }

        // Remove duplicates
        wildcardMatches = Array.from(new Set(wildcardMatches));
      }

      console.log('Final results:', { exactMatches, wildcardMatches });
      
      return {
        exactMatches,
        wildcardMatches
      };
    },
    enabled: Boolean(searchTerm)
  });
};