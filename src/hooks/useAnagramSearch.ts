import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, generateAlphagram, toDisplayFormat } from "@/utils/digraphs";
import { useMemo } from "react";

// Spanish alphabet including digraphs in specified order
const SPANISH_LETTERS = ["A", "B", "C", "Ç", "CH", "D", "E", "F", "G", "H", "I", "J", "K", "L", "LL", "M", "N", "Ñ", "O", "P", "Q", "R", "RR", "S", "T", "U", "V", "W", "X", "Y", "Z"];

// Increased batch size for more efficient querying
const BATCH_SIZE = 50;

export const useAnagramSearch = (searchTerm: string) => {
  // Memoize the initial processing of the search term
  const { wildcardCount, questionMarkCount, processedInput, targetAlphagram, inputLength, questionMarkPositions } = useMemo(() => {
    const starCount = (searchTerm.match(/\*/g) || []).length;
    const qCount = (searchTerm.match(/\?/g) || []).length;
    const lettersOnly = searchTerm.replace(/[*?]/g, '');
    const processed = processDigraphs(lettersOnly);
    
    // Get positions of question marks
    const qPositions = searchTerm.split('').map((char, index) => 
      char === '?' ? index : null
    ).filter((pos): pos is number => pos !== null);

    console.log('Search term processing:', {
      searchTerm,
      starCount,
      qCount,
      lettersOnly,
      processed,
      qPositions
    });

    return {
      wildcardCount: starCount + qCount,
      questionMarkCount: qCount,
      processedInput: processed,
      targetAlphagram: generateAlphagram(processed),
      inputLength: processed.length + starCount + qCount, // Include wildcards in length
      questionMarkPositions: qPositions
    };
  }, [searchTerm]);

  return useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
      
      console.log('Starting search with:', {
        searchTerm,
        wildcardCount,
        questionMarkCount,
        processedInput,
        targetAlphagram,
        inputLength,
        questionMarkPositions
      });

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
          console.log('Exact matches:', exactMatches);
        }
      }

      // For wildcard searches, we need to try all possible letter combinations
      let wildcardMatches: string[] = [];
      let additionalWildcardMatches: string[] = [];
      
      if (wildcardCount > 0) {
        // Query words with the same length for wildcard matches
        const { data: wildcardData, error: wildcardError } = await supabase
          .from("words")
          .select("word")
          .eq('lenght', inputLength);

        if (wildcardError) {
          console.error("Supabase error (wildcard):", wildcardError);
        } else if (wildcardData) {
          console.log(`Found ${wildcardData.length} potential matches to filter`);
          
          // Filter matches based on pattern
          const pattern = searchTerm.split('').map(char => {
            if (char === '?') return '.';
            if (char === '*') return '[A-ZÑÇÁÉÍÓÚ]';
            return char;
          }).join('');
          
          const regex = new RegExp(`^${pattern}$`);
          console.log('Using regex pattern:', pattern);

          wildcardMatches = wildcardData
            .map(d => toDisplayFormat(d.word))
            .filter(word => {
              const matches = regex.test(word);
              console.log(`Testing ${word} against pattern:`, matches);
              return matches;
            });

          console.log('Filtered wildcard matches:', wildcardMatches);
        }

        // Query words with length + 1 for additional wildcard matches
        if (wildcardCount > 0) {
          const { data: additionalData, error: additionalError } = await supabase
            .from("words")
            .select("word")
            .eq('lenght', inputLength + 1);

          if (additionalError) {
            console.error("Supabase error (additional):", additionalError);
          } else if (additionalData) {
            console.log(`Found ${additionalData.length} potential additional matches to filter`);
            
            // Add an extra wildcard to the pattern for additional matches
            const additionalPattern = searchTerm.split('').map(char => {
              if (char === '?') return '.';
              if (char === '*') return '[A-ZÑÇÁÉÍÓÚ]';
              return char;
            }).join('');
            
            const additionalRegex = new RegExp(`^${additionalPattern}[A-ZÑÇÁÉÍÓÚ]$`);
            console.log('Using additional regex pattern:', additionalPattern + '[A-ZÑÇÁÉÍÓÚ]');

            additionalWildcardMatches = additionalData
              .map(d => toDisplayFormat(d.word))
              .filter(word => {
                const matches = additionalRegex.test(word);
                console.log(`Testing ${word} against additional pattern:`, matches);
                return matches;
              });

            console.log('Filtered additional wildcard matches:', additionalWildcardMatches);
          }
        }
      }

      return {
        exactMatches,
        wildcardMatches,
        additionalWildcardMatches
      };
    },
    enabled: Boolean(searchTerm)
  });
};