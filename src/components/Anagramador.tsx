import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import SearchInput from "./anagramador/SearchInput";
import { ResultsHeader } from "./anagramador/ResultsHeader";
import ResultsList from "./anagramador/ResultsList";
import { Trie } from "@/utils/trie";
import { validateAndCleanPatternInput } from "@/utils/inputValidation";
import { searchPattern as searchPatternFn } from "@/utils/trie/search";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface AnagramadorProps {
  trie: Trie;
  isLoading: boolean;
  error: string | null;
}

const Anagramador = ({ trie, isLoading, error }: AnagramadorProps) => {
  const { toast } = useToast();
  const [pattern, setPattern] = useState("");
  const [results, setResults] = useState<SearchResults>({
    exactMatches: [],
    wildcardMatches: [],
    additionalWildcardMatches: [],
    patternMatches: []
  });

  const handleSearch = useCallback((searchPattern: string) => {
    const cleanedPattern = validateAndCleanPatternInput(searchPattern);
    if (cleanedPattern) {
      const searchResults = searchPatternFn(trie, cleanedPattern);
      setResults({
        exactMatches: searchResults,
        wildcardMatches: [],
        additionalWildcardMatches: [],
        patternMatches: []
      });
      setPattern(cleanedPattern);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Patrón de búsqueda no válido.",
      });
    }
  }, [trie, toast]);

  const highlightWildcardLetter = useCallback((word: string, originalWord: string) => {
    return word;
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <SearchInput 
        onSearch={handleSearch}
        isLoading={isLoading}
        error={error}
      />
      <ResultsHeader results={results} />
      <ResultsList 
        isLoading={isLoading}
        searchTerm={pattern}
        results={results}
        highlightWildcardLetter={highlightWildcardLetter}
      />
    </div>
  );
};

export default Anagramador;