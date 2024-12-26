import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";
import { ResultsHeader } from "./ResultsHeader";
import { ExactResults } from "./ExactResults";
import { ShorterResults } from "./ShorterResults";
import { PatternResults } from "./PatternResults";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: SearchResults;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
}

const ResultsList = ({ isLoading, searchTerm, results, highlightWildcardLetter }: ResultsListProps) => {
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');

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
          results.additionalWildcardMatches?.length > 0 ||
          results.patternMatches?.length > 0)
        ) ? (
          <>
            <ResultsHeader results={results} />
            {isPatternSearch ? (
              <PatternResults
                matches={results.patternMatches || []}
                searchTerm={searchTerm}
              />
            ) : (
              <>
                <ExactResults
                  matches={wildcardCount === 0 ? (results.exactMatches || []) : (results.wildcardMatches || [])}
                  wildcardCount={wildcardCount}
                  highlightWildcardLetter={highlightWildcardLetter}
                  searchTerm={searchTerm}
                />
                <ShorterResults
                  matches={results.additionalWildcardMatches || []}
                  highlightWildcardLetter={highlightWildcardLetter}
                  searchTerm={searchTerm}
                />
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