import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
  } | undefined;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
}

const ResultsList = ({ isLoading, searchTerm, results, highlightWildcardLetter }: ResultsListProps) => {
  // Count wildcards in search term
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            Buscando anagramas...
          </div>
        ) : results && (results.exactMatches.length > 0 || results.wildcardMatches.length > 0) ? (
          <>
            {results.exactMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {wildcardCount > 0 ? (
                    wildcardCount === 2 ? 
                      "Palabras encontradas con dos comodines:" :
                      "Palabras encontradas con un comodín:"
                  ) : (
                    `${results.exactMatches.length} ${results.exactMatches.length === 1 ? "anagrama" : "anagramas"} encontrados:`
                  )}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.exactMatches.map((word, index) => (
                    <a
                      key={`exact-${index}`}
                      href={`https://dle.rae.es/?w=${word}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
                    >
                      {wildcardCount > 0 ? highlightWildcardLetter(word, searchTerm) : word}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {results.wildcardMatches.length > 0 && wildcardCount > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  Palabras encontradas con un comodín y una letra adicional:
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.wildcardMatches.map((word, index) => (
                    <a
                      key={`wildcard-${index}`}
                      href={`https://dle.rae.es/?w=${word}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
                    >
                      {highlightWildcardLetter(word, searchTerm)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : searchTerm ? (
          <p className="text-gray-500 text-lg">No se encontraron palabras.</p>
        ) : null}
      </div>
    </ScrollArea>
  );
};

export default ResultsList;