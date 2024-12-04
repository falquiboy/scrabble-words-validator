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
      
      console.log("Search term:", searchTerm);
      
      // Count wildcards
      const wildcardCount = (searchTerm.match(/\*/g) || []).length;
      const lettersOnly = searchTerm.replace(/\*/g, '');
      
      console.log("Wildcards:", wildcardCount);
      console.log("Letters only:", lettersOnly);
      
      // Process input with digraphs and generate alphagram
      const processedInput = processDigraphs(lettersOnly);
      const targetAlphagram = generateAlphagram(processedInput);
      const inputLength = processedInput.length;
      
      console.log("Processed input:", processedInput);
      console.log("Target alphagram:", targetAlphagram);
      console.log("Input length:", inputLength);

      // Query exact matches (considering wildcards)
      const { data: exactData, error: exactError } = await supabase
        .from("words")
        .select("word")
        .eq('lenght', inputLength + wildcardCount);

      if (exactError) {
        console.error("Supabase error (exact):", exactError);
        return { exactMatches: [], wildcardMatches: [] };
      }

      console.log("Raw exact matches:", exactData);

      // Filter exact matches that contain all the letters from the input
      const exactMatches = exactData?.filter(d => {
        const wordAlphagram = generateAlphagram(processDigraphs(d.word));
        console.log(`Checking word: ${d.word}, alphagram: ${wordAlphagram}`);
        
        const inputLetters = targetAlphagram.split('');
        const matches = inputLetters.every(letter => {
          const hasLetter = wordAlphagram.includes(letter);
          const correctCount = wordAlphagram.split(letter).length - 1 >= targetAlphagram.split(letter).length - 1;
          console.log(`Letter ${letter}: exists=${hasLetter}, correct count=${correctCount}`);
          return hasLetter && correctCount;
        });
        
        console.log(`Word ${d.word} matches: ${matches}`);
        return matches;
      }).map(d => toDisplayFormat(d.word)) || [];

      console.log("Filtered exact matches:", exactMatches);

      // Generate all possible combinations with one additional letter
      const wildcardPromises = SPANISH_LETTERS.map(async (letter) => {
        const combinedLetters = processedInput + letter;
        const wildcardAlphagram = generateAlphagram(combinedLetters);
        
        console.log(`Trying wildcard with letter: ${letter}`);
        console.log(`Combined letters: ${combinedLetters}`);
        console.log(`Wildcard alphagram: ${wildcardAlphagram}`);

        const { data, error } = await supabase
          .from("words")
          .select("word")
          .eq('lenght', inputLength + wildcardCount + 1);

        if (error) {
          console.error(`Supabase error (wildcard - ${letter}):`, error);
          return [];
        }

        console.log(`Raw wildcard matches for letter ${letter}:`, data);

        // Filter wildcard matches that contain all the letters from the input
        return data?.filter(d => {
          const wordAlphagram = generateAlphagram(processDigraphs(d.word));
          console.log(`Checking wildcard word: ${d.word}, alphagram: ${wordAlphagram}`);
          
          const inputLetters = targetAlphagram.split('');
          const matches = inputLetters.every(letter => {
            const hasLetter = wordAlphagram.includes(letter);
            const correctCount = wordAlphagram.split(letter).length - 1 >= targetAlphagram.split(letter).length - 1;
            console.log(`Letter ${letter}: exists=${hasLetter}, correct count=${correctCount}`);
            return hasLetter && correctCount;
          });
          
          console.log(`Wildcard word ${d.word} matches: ${matches}`);
          return matches;
        }).map(d => toDisplayFormat(d.word)) || [];
      });

      // Wait for all wildcard queries to complete
      const wildcardResults = await Promise.all(wildcardPromises);
      console.log("All wildcard results:", wildcardResults);
      
      // Flatten and deduplicate wildcard results
      const uniqueWildcardMatches = Array.from(new Set(
        wildcardResults.flat()
      ));
      
      console.log("Final unique wildcard matches:", uniqueWildcardMatches);
      
      return {
        exactMatches,
        wildcardMatches: uniqueWildcardMatches
      };
    },
    enabled: Boolean(searchTerm)
  });
};