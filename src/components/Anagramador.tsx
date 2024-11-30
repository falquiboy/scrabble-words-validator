import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Search } from "lucide-react";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [processedLetters, setProcessedLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Process digraphs (CH, LL, RR)
  const processDigraphs = (input: string) => {
    let processed = input.toUpperCase();
    processed = processed.replace(/CH/g, "Ç"); // Use Ç as placeholder for CH
    processed = processed.replace(/LL/g, "K"); // Use K as placeholder for LL
    processed = processed.replace(/RR/g, "W"); // Use W as placeholder for RR
    return processed;
  };

  // Generate alphagram from input
  const generateAlphagram = (input: string) => {
    const vowels = input.match(/[AEIOU]/g) || [];
    const consonants = input.match(/[^AEIOU]/g) || [];
    return [...vowels].sort().join("") + [...consonants].sort().join("");
  };

  // Query for anagrams
  const { data: anagrams, isLoading } = useQuery({
    queryKey: ["anagrams", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const alphagram = generateAlphagram(searchTerm);
      const { data, error } = await supabase
        .from("alphagrams")
        .select("word")
        .eq("alphagram", alphagram)
        .eq("word_length", searchTerm.length);

      if (error) throw error;
      return data?.map(d => d.word) || [];
    },
    enabled: searchTerm.length > 0
  });

  // Handle input changes
  const handleInputChange = (value: string) => {
    setLetters(value.toUpperCase());
    setProcessedLetters(processDigraphs(value));
  };

  // Handle search
  const handleSearch = () => {
    setSearchTerm(processedLetters);
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
        >
          <Search className="h-6 w-6" />
        </Button>
      </div>
      <div className="min-h-[100px] text-left">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            Buscando anagramas...
          </div>
        ) : anagrams && anagrams.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-semibold">
              {anagrams.length} {anagrams.length === 1 ? "anagrama" : "anagramas"} encontrados:
            </h3>
            <p className="text-gray-700">
              {anagrams.join(", ")}
            </p>
          </div>
        ) : searchTerm ? (
          <p className="text-gray-500">0 anagramas encontrados.</p>
        ) : null}
      </div>
    </div>
  );
};

export default Anagramador;