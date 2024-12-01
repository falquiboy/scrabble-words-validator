import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Search } from "lucide-react";
import { processDigraphs, generateAlphagram, toDisplayFormat } from "@/utils/digraphs";

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

      // Query wildcard matches (one letter longer)
      const { data: wildcardData, error: wildcardError } = await supabase
        .from("words")
        .select("word")
        .eq('lenght', inputLength + 1)
        .ilike('alphagram', `%${targetAlphagram}%`);

      if (wildcardError) {
        console.error("Supabase error (wildcard):", wildcardError);
        return { exactMatches: exactData?.map(d => toDisplayFormat(d.word)) || [], wildcardMatches: [] };
      }
      
      // Convert results back to display format
      return {
        exactMatches: exactData?.map(d => toDisplayFormat(d.word)) || [],
        wildcardMatches: wildcardData?.map(d => toDisplayFormat(d.word)) || []
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ingresa letras..."
          value={letters}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-2xl font-bold h-16 text-left"
          autoFocus
        />
        <Button 
          onClick={handleSearch}
          className="h-16 px-6"
          variant="default"
          disabled={!letters.trim()}
        >
          <Search className="h-6 w-6" />
        </Button>
      </div>
      <div className="min-h-[100px] text-left space-y-4">
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
                <p className="text-gray-700">
                  {results.exactMatches.join(", ")}
                </p>
              </div>
            )}
            {results.wildcardMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {results.wildcardMatches.length} {results.wildcardMatches.length === 1 ? "palabra" : "palabras"} encontradas usando una letra adicional:
                </h3>
                <p className="text-gray-700">
                  {results.wildcardMatches.join(", ")}
                </p>
              </div>
            )}
          </>
        ) : searchTerm ? (
          <p className="text-gray-500">No se encontraron palabras.</p>
        ) : null}
      </div>
    </div>
  );
};

export default Anagramador;