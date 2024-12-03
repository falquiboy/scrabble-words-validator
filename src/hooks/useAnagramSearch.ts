import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, generateAlphagram, toDisplayFormat } from "@/utils/digraphs";

// Spanish alphabet including digraphs in specified order
const SPANISH_LETTERS = ["A", "E", "I", "O", "U", "B", "C", "Ç", "D", "F", "G", "H", "J", "L", "K", "M", "N", "Ñ", "P", "Q", "R", "W", "S", "T", "V", "X", "Y", "Z"];

export const useAnagramSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { exactMatches: [], wildcardMatches: [] };
      
      // Process input with digraphs and generate alphagram
      const processedInput = processDigraphs(searchTerm);
      const targetAlphagram = generateAlphagram(processedInput);
      const inputLength = processedInput.length;

      // Query exact matches
      const { data: exactData, error: exactError } = await supabase
        .from("words")
        .select("word")
        .eq('lenght', inputLength)
        .eq('alphagram', targetAlphagram);

      if (exactError) {
        console.error("Supabase error (exact):", exactError);
        return { exactMatches: [], wildcardMatches: [] };
      }

      // Generate all possible combinations with one additional letter
      const wildcardPromises = SPANISH_LETTERS.map(async (letter) => {
        const combinedLetters = processedInput + letter;
        const wildcardAlphagram = generateAlphagram(combinedLetters);
        
        const { data, error } = await supabase
          .from("words")
          .select("word")
          .eq('lenght', inputLength + 1)
          .eq('alphagram', wildcardAlphagram);

        if (error) {
          console.error(`Supabase error (wildcard - ${letter}):`, error);
          return [];
        }

        return data?.map(d => d.word) || [];
      });

      // Wait for all wildcard queries to complete
      const wildcardResults = await Promise.all(wildcardPromises);
      
      // Flatten and deduplicate wildcard results
      const uniqueWildcardMatches = Array.from(new Set(
        wildcardResults.flat()
      ));
      
      // Convert results back to display format
      return {
        exactMatches: exactData?.map(d => toDisplayFormat(d.word)) || [],
        wildcardMatches: uniqueWildcardMatches.map(word => toDisplayFormat(word))
      };
    },
    enabled: Boolean(searchTerm)
  });
};