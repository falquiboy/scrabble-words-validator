import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, generateAlphagram } from "@/utils/digraphs";

// Spanish alphabet including digraphs in specified order
const SPANISH_LETTERS = ["A", "E", "I", "O", "U", "B", "C", "Ç", "D", "F", "G", "H", "J", "L", "K", "M", "N", "Ñ", "P", "Q", "R", "W", "S", "T", "V", "X", "Y", "Z"];

export const useAnagramSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { exactMatches: [], wildcardMatches: [] };
      
      const processedInput = processDigraphs(searchTerm);
      const targetAlphagram = generateAlphagram(processedInput);
      const inputLength = processedInput.length;

      const { data: exactData, error: exactError } = await supabase
        .from("words")
        .select("word")
        .eq('lenght', inputLength)
        .eq('alphagram', targetAlphagram);

      if (exactError) {
        console.error("Supabase error (exact):", exactError);
        return { exactMatches: [], wildcardMatches: [] };
      }

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

      const wildcardResults = await Promise.all(wildcardPromises);
      const uniqueWildcardMatches = Array.from(new Set(wildcardResults.flat()));
      
      return {
        exactMatches: exactData?.map(d => d.word) || [],
        wildcardMatches: uniqueWildcardMatches
      };
    },
    enabled: Boolean(searchTerm)
  });
};