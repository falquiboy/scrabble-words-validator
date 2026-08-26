
import { Loader } from "lucide-react";
import { ExactResults } from "../ExactResults";
import { ShorterResults } from "../ShorterResults";
import { PatternResults } from "../PatternResults";
import { isPatternQuery } from "@/utils/queryLanguage.mjs";

interface SearchResultsProps {
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
  showShorter: boolean;
}

const SearchResults = ({ 
  isLoading, 
  searchTerm, 
  results,
  highlightWildcardLetter,
  showShorter
}: SearchResultsProps) => {
  const wildcardCount = (searchTerm.match(/\?/g) || []).length;
  const isPatternSearch = isPatternQuery(searchTerm);
  const fullRackMatches = wildcardCount === 0 ? results.exactMatches : results.wildcardMatches;
  const fullRackSet = new Set(fullRackMatches);
  const additionalMatches = results.additionalWildcardMatches.filter((word) => !fullRackSet.has(word));

  if (isLoading) {
    console.log('🔄 SearchResults: Showing loading spinner');
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader className="h-4 w-4 animate-spin" />
        Preparando búsqueda...
      </div>
    );
  }

  if (!searchTerm) {
    return null;
  }

  const hasResults = results.exactMatches?.length > 0 || 
    results.wildcardMatches?.length > 0 || 
    results.shorterMatches?.length > 0 ||
    results.patternMatches?.length > 0;

  // For pattern searches, show the generic message if no results
  if (!hasResults && isPatternSearch) {
    if (searchTerm && !isLoading) {
      return <p className="text-gray-500 text-lg">No se encontraron palabras.</p>;
    }
    return null;
  }

  // For non-pattern searches, always show the specific notifications
  // even if there are no results in any category

  return (
    <>
      {isPatternSearch ? (
        <PatternResults
          matches={results.patternMatches || []}
          searchTerm={searchTerm}
          showLongerWords={showShorter}
        />
      ) : (
        <>
          {!showShorter && (
            <>
              <ExactResults
                matches={fullRackMatches}
                wildcardCount={wildcardCount}
                highlightWildcardLetter={highlightWildcardLetter}
                searchTerm={searchTerm}
              />
              <ShorterResults
                matches={additionalMatches}
                highlightWildcardLetter={highlightWildcardLetter}
                searchTerm={searchTerm}
                title="Resultados con ficha adicional"
                unifiedEquityView={false}
              />
            </>
          )}
          {showShorter && results.wildcardMatches?.length > 0 && (
            <ShorterResults
              matches={results.wildcardMatches}
              highlightWildcardLetter={highlightWildcardLetter}
              searchTerm={searchTerm}
              title="Resultados con comodín"
              unifiedEquityView={false}
            />
          )}
          {results.shorterMatches?.length > 0 && (
            <ShorterResults
              matches={results.shorterMatches}
              highlightWildcardLetter={highlightWildcardLetter}
              searchTerm={searchTerm}
              title={showShorter && results.wildcardMatches.length > 0
                ? "Resultados sin comodín"
                : "palabras más cortas encontradas"}
              unifiedEquityView={false} // Keep grouped view, just sort within groups
            />
          )}
        </>
      )}
    </>
  );
};

export default SearchResults;
