import { useWordTrie } from "@/hooks/useWordTrie";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useAnagramSearch } from "@/hooks/useAnagramSearch";
import { Loader } from "lucide-react";

export function Anagramador() {
  const { isLoading: isLoadingDB, clearDatabase } = useWordDatabase();
  const { isLoading: isLoadingTrie, trie } = useWordTrie();
  const { searchTerm, results, isSearching, highlightWildcardLetter } = useAnagramSearch(trie);

  const isLoading = isLoadingDB || isLoadingTrie;

  const handleClearDatabase = async () => {
    if (window.confirm('¿Estás seguro de que quieres borrar la base de datos local? La aplicación se recargará para reconstruirla.')) {
      await clearDatabase();
    }
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
      <SearchInput isLoading={isSearching} />
      <ResultsList
        isLoading={isSearching}
        searchTerm={searchTerm}
        results={results}
        highlightWildcardLetter={highlightWildcardLetter}
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
}