import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import SearchInput from "./anagramador/SearchInput";
import ResultsHeader from "./anagramador/ResultsHeader";
import ResultsList from "./anagramador/ResultsList";
import { Trie } from "@/utils/trie";
import { validateAndCleanPatternInput } from "@/utils/inputValidation";
import { searchPattern } from "@/utils/trie/search";

interface AnagramadorProps {
  trie: Trie;
  isLoading: boolean;
  error: string | null;
}

const Anagramador = ({ trie, isLoading, error }: AnagramadorProps) => {
  const { toast } = useToast();
  const [pattern, setPattern] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = useCallback((pattern: string) => {
    const cleanedPattern = validateAndCleanPatternInput(pattern);
    if (cleanedPattern) {
      const searchResults = searchPattern(trie, cleanedPattern);
      setResults(searchResults);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Patrón de búsqueda no válido.",
      });
    }
  }, [trie, toast]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <SearchInput 
        onSearch={handleSearch}
        isLoading={isLoading}
        error={error}
      />
      <ResultsHeader results={results} />
      <ResultsList results={results} />
    </div>
  );
};

export default Anagramador;
