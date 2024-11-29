import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "lucide-react";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [processedLetters, setProcessedLetters] = useState("");
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
    queryKey: ["anagrams", processedLetters],
    queryFn: async () => {
      if (!processedLetters) return [];
      
      const alphagram = generateAlphagram(processedLetters);
      const { data, error } = await supabase
        .from("alphagrams")
        .select("word")
        .eq("alphagram", alphagram)
        .eq("word_length", processedLetters.length);

      if (error) throw error;
      return data?.map(d => d.word) || [];
    },
    enabled: processedLetters.length > 0
  });

  // Handle input changes
  const handleInputChange = (value: string) => {
    setLetters(value.toUpperCase());
    setProcessedLetters(processDigraphs(value));
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md space-y-4">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Ingresa letras..."
        value={letters}
        onChange={(e) => handleInputChange(e.target.value)}
        className="text-2xl font-bold h-16 text-left"
        autoFocus
      />
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
        ) : processedLetters ? (
          <p className="text-gray-500">0 anagramas encontrados.</p>
        ) : null}
      </div>
    </div>
  );
};

export default Anagramador;