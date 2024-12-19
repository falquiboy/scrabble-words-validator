import { useWordTrie } from "@/hooks/useWordTrie";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useAnagramSearch } from "@/hooks/useAnagramSearch";
import { Loader } from "lucide-react";
import { useState } from "react";

export const Anagramador = () => {
  const { isLoading: isLoadingDB, clearDatabase } = useWordDatabase();
  const { isLoading: isLoadingTrie } = useWordTrie();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, isLoading: isSearching } = useAnagramSearch(searchTerm);

  const isLoading = isLoadingDB || isLoadingTrie;

  const handleClearDatabase = async () => {
    if (window.confirm('¿Estás seguro de que quieres borrar la base de datos local? La aplicación se recargará para reconstruirla.')) {
      await clearDatabase();
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="flex items-center gap-2">
          <Loader className="h-4 w-4 animate-spin" />
          <p className="text-gray-500">Cargando diccionario...</p>
        </div>
        <Button
          variant="outline"
          onClick={handleClearDatabase}
          className="mt-4"
        >
          Borrar base de datos local
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <SearchInput 
        letters={searchTerm}
        showShorter={false}
        onInputChange={handleInputChange}
        onSearch={() => {}}
        onClear={handleClear}
        onKeyPress={() => {}}
        onShowShorterChange={() => {}}
        isLoading={isSearching}
      />
      <ResultsList
        isLoading={isSearching}
        searchTerm={searchTerm}
        results={searchResults || {
          exactMatches: [],
          wildcardMatches: [],
          additionalWildcardMatches: [],
          patternMatches: []
        }}
        highlightWildcardLetter={(word: string) => word}
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleClearDatabase}
          size="sm"
        >
          Borrar base de datos local
        </Button>
      </div>
    </div>
  );
};