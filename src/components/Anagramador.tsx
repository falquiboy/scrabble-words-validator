import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Search, X } from "lucide-react";
import { processDigraphs, generateAlphagram, toDisplayFormat } from "@/utils/digraphs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Spanish alphabet including digraphs in specified order
const SPANISH_LETTERS = ["A", "E", "I", "O", "U", "B", "C", "Ç", "D", "F", "G", "H", "J", "L", "K", "M", "N", "Ñ", "P", "Q", "R", "W", "S", "T", "V", "X", "Y", "Z"];

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Query for words
  const { data: results, isLoading } = useQuery({
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

  // Handle input changes
  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-Z]/g, '');
    setLetters(sanitizedValue.toUpperCase());
  };

  // Handle search
  const handleSearch = () => {
    if (letters.trim()) {
      setSearchTerm(letters);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClear = () => {
    setLetters("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  // Highlight the additional letter (wildcard)
  const highlightWildcardLetter = (word: string, originalWord: string) => {
    if (word.length <= originalWord.length) return word;
    
    // Find the letter that's not in the original word
    const wordLetters = word.split('');
    const originalLetters = originalWord.split('');
    
    // Create a copy of original letters to track what's been matched
    let remainingOriginal = [...originalLetters];
    
    // Find which letter in word is the extra one
    let extraLetter = '';
    let extraLetterLastIndex = -1;
    
    wordLetters.forEach((letter, index) => {
      const matchIndex = remainingOriginal.indexOf(letter);
      if (matchIndex === -1) {
        // This letter wasn't found in remaining original letters
        extraLetter = letter;
        extraLetterLastIndex = word.lastIndexOf(letter);
      } else {
        // Remove the matched letter from remaining original letters
        remainingOriginal.splice(matchIndex, 1);
      }
    });
    
    return (
      <>
        {word.slice(0, extraLetterLastIndex)}
        <span className="text-blue-500">{word[extraLetterLastIndex]}</span>
        {word.slice(extraLetterLastIndex + 1)}
      </>
    );
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ingresa letras..."
            value={letters}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-2xl font-bold h-16 text-left pr-12"
            autoFocus
          />
          {letters && (
            <Button
              onClick={handleClear}
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0"
              type="button"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleSearch}
          className="h-16 px-6"
          variant="default"
          disabled={!letters.trim()}
        >
          <Search className="h-6 w-6" />
        </Button>
      </div>
      <ScrollArea className="h-[60vh]">
        <div className="space-y-4 pr-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader className="h-4 w-4 animate-spin" />
              Buscando anagramas...
            </div>
          ) : results && (results.exactMatches.length > 0 || results.wildcardMatches.length > 0) ? (
            <>
              {results.exactMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {results.exactMatches.length} {results.exactMatches.length === 1 ? "anagrama" : "anagramas"} encontrados:
                  </h3>
                  <div>
                    {results.exactMatches.map((word, index) => (
                      <a
                        key={`exact-${index}`}
                        href={`https://dle.rae.es/?w=${word}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-100 p-2 rounded transition-colors"
                      >
                        {word}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {results.wildcardMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {results.wildcardMatches.length} {results.wildcardMatches.length === 1 ? "palabra" : "palabras"} encontradas usando una letra adicional:
                  </h3>
                  <div>
                    {results.wildcardMatches.map((word, index) => (
                      <a
                        key={`wildcard-${index}`}
                        href={`https://dle.rae.es/?w=${word}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-100 p-2 rounded transition-colors"
                      >
                        {highlightWildcardLetter(word, searchTerm)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : searchTerm ? (
            <p className="text-gray-500">No se encontraron palabras.</p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Anagramador;
