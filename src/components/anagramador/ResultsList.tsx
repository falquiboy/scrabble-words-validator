import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResultsHeader } from "./ResultsHeader";
import { ExactResults } from "./ExactResults";
import { ShorterResults } from "./ShorterResults";
import { PatternResults } from "./PatternResults";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    shorterMatches: string[];
    patternMatches: string[];
  };
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  isSearchAborted?: boolean;
}

const ResultsList = ({ 
  isLoading, 
  searchTerm, 
  results, 
  highlightWildcardLetter,
  isSearchAborted 
}: ResultsListProps) => {
  const { toast } = useToast();
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');

  // Remove any duplicates between wildcardMatches and additionalWildcardMatches
  const filteredAdditionalMatches = results.additionalWildcardMatches.filter(word => {
    if (wildcardCount === 0) {
      return !results.exactMatches.includes(word);
    } else {
      return !results.wildcardMatches.includes(word);
    }
  });

  const handleCopyAll = () => {
    if (!results) return;

    let allWords: string[] = [];

    if (isPatternSearch) {
      allWords = [...(results.patternMatches || [])];
    } else {
      // Include exact/wildcard matches
      if (wildcardCount === 0) {
        allWords = [...(results.exactMatches || [])];
      } else {
        allWords = [...(results.wildcardMatches || [])];
      }
      
      // Include additional letter matches (filtered)
      if (filteredAdditionalMatches.length > 0) {
        allWords = [...allWords, ...filteredAdditionalMatches];
      }
      
      // Include shorter matches if any
      if (results.shorterMatches?.length > 0) {
        allWords = [...allWords, ...(results.shorterMatches || [])];
      }
    }

    navigator.clipboard.writeText(allWords.join('\n')).then(() => {
      toast({
        title: "¡Copiado!",
        description: `${allWords.length} ${allWords.length === 1 ? 'palabra copiada' : 'palabras copiadas'}`,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudieron copiar las palabras",
        variant: "destructive",
      });
    });
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] px-1">
      <div className="space-y-4 pb-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            Preparando búsqueda...
          </div>
        ) : results && (
          (results.exactMatches?.length > 0 || 
          results.wildcardMatches?.length > 0 || 
          filteredAdditionalMatches.length > 0 ||
          results.shorterMatches?.length > 0 ||
          results.patternMatches?.length > 0)
        ) ? (
          <>
            <ResultsHeader onCopyAll={handleCopyAll} />
            {isPatternSearch ? (
              <PatternResults
                matches={results.patternMatches || []}
                searchTerm={searchTerm}
              />
            ) : (
              <>
                {/* Show either exact matches or wildcard matches */}
                {(wildcardCount === 0 ? results.exactMatches?.length > 0 : results.wildcardMatches?.length > 0) && (
                  <ExactResults
                    matches={wildcardCount === 0 ? results.exactMatches : results.wildcardMatches}
                    wildcardCount={wildcardCount}
                    highlightWildcardLetter={highlightWildcardLetter}
                    searchTerm={searchTerm}
                  />
                )}
                {/* Show additional wildcard matches if any */}
                {filteredAdditionalMatches.length > 0 && (
                  <ShorterResults
                    matches={filteredAdditionalMatches}
                    highlightWildcardLetter={highlightWildcardLetter}
                    searchTerm={searchTerm}
                    title="palabras encontradas usando todas las fichas más una letra adicional"
                  />
                )}
                {/* Show shorter matches if any */}
                {results.shorterMatches?.length > 0 && (
                  <ShorterResults
                    matches={results.shorterMatches}
                    highlightWildcardLetter={highlightWildcardLetter}
                    searchTerm={searchTerm}
                    title="palabras más cortas encontradas"
                  />
                )}
              </>
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