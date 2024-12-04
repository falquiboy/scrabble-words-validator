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
      
      // Count wildcards
      const wildcardCount = (searchTerm.match(/\*/g) || []).length;
      const lettersOnly = searchTerm.replace(/\*/g, '');
      
      // Process input with digraphs and generate alphagram
      const processedInput = processDigraphs(lettersOnly);
      const targetAlphagram = generateAlphagram(processedInput);
      const inputLength = processedInput.length;

      // Query exact matches (considering wildcards)
      const { data: exactData, error: exactError } = await supabase
        .from("words")
        .select("word")
        .eq('lenght', inputLength + wildcardCount);

      if (exactError) {
        console.error("Supabase error (exact):", exactError);
        return { exactMatches: [], wildcardMatches: [] };
      }

      // Filter exact matches that contain all the letters from the input
      const exactMatches = exactData?.filter(d => {
        const wordAlphagram = generateAlphagram(processDigraphs(d.word));
        const inputLetters = targetAlphagram.split('');
        return inputLetters.every(letter => 
          wordAlphagram.includes(letter) && 
          wordAlphagram.split(letter).length - 1 >= targetAlphagram.split(letter).length - 1
        );
      }).map(d => toDisplayFormat(d.word)) || [];

      // Generate all possible combinations with one additional letter
      const wildcardPromises = SPANISH_LETTERS.map(async (letter) => {
        const combinedLetters = processedInput + letter;
        const wildcardAlphagram = generateAlphagram(combinedLetters);
        
        const { data, error } = await supabase
          .from("words")
          .select("word")
          .eq('lenght', inputLength + wildcardCount + 1);

        if (error) {
          console.error(`Supabase error (wildcard - ${letter}):`, error);
          return [];
        }

        // Filter wildcard matches that contain all the letters from the input
        return data?.filter(d => {
          const wordAlphagram = generateAlphagram(processDigraphs(d.word));
          const inputLetters = targetAlphagram.split('');
          return inputLetters.every(letter => 
            wordAlphagram.includes(letter) && 
            wordAlphagram.split(letter).length - 1 >= targetAlphagram.split(letter).length - 1
          );
        }).map(d => toDisplayFormat(d.word)) || [];
      });

      // Wait for all wildcard queries to complete
      const wildcardResults = await Promise.all(wildcardPromises);
      
      // Flatten and deduplicate wildcard results
      const uniqueWildcardMatches = Array.from(new Set(
        wildcardResults.flat()
      ));
      
      return {
        exactMatches,
        wildcardMatches: uniqueWildcardMatches
      };
    },
    enabled: Boolean(searchTerm)
  });
};