import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader, Search } from "lucide-react";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Query for words
  const { data: words, isLoading } = useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const chars = [...searchTerm.toUpperCase()].sort().join('');
      const { data, error } = await supabase
        .from("FILE2")
        .select("PALABRA")
        .textSearch('PALABRA', searchTerm.toUpperCase(), {
          type: 'plain',
          config: 'spanish'
        });

      if (error) {
        console.error("Supabase error:", error);
        return [];
      }
      
      // Filter results to only include actual anagrams
      const results = data
        ?.map(d => d.PALABRA)
        .filter(word => [...word].sort().join('') === chars) || [];
      
      return results;
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
      <div className="min-h-[100px] text-left">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            Buscando anagramas...
          </div>
        ) : words && words.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-semibold">
              {words.length} {words.length === 1 ? "anagrama" : "anagramas"} encontrados:
            </h3>
            <p className="text-gray-700">
              {words.join(", ")}
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