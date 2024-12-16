import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    patternMatches: string[];
    shorterMatches: Map<number, Set<string>>;
  } | undefined;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
}

const ResultsList = ({ isLoading, searchTerm, results, highlightWildcardLetter }: ResultsListProps) => {
  // Count wildcards in search term
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const isPatternSearch = searchTerm.includes('/');

  // Helper function to render word links
  const renderWordLink = (word: string, index: number, prefix: string) => (
    <a
      key={`${prefix}-${index}`}
      href={`https://dle.rae.es/?w=${word}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
    >
      {word}
    </a>
  );

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            Buscando anagramas...
          </div>
        ) : results && (
          results.patternMatches.length > 0 || 
          results.exactMatches.length > 0 || 
          results.wildcardMatches.length > 0 || 
          results.additionalWildcardMatches.length > 0 ||
          results.shorterMatches.size > 0
        ) ? (
          <>
            {/* Pattern matches section */}
            {isPatternSearch && results.patternMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {`${results.patternMatches.length} ${results.patternMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.patternMatches.map((word, index) => renderWordLink(word, index, 'pattern'))}
                </div>
              </div>
            )}

            {/* Regular search results sections */}
            {!isPatternSearch && (
              <>
                {/* First section: Results with exact letters or wildcards */}
                {(results.exactMatches.length > 0 || results.wildcardMatches.length > 0) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {wildcardCount === 0 ? (
                        `${results.exactMatches.length} ${results.exactMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las letras:`
                      ) : (
                        `${results.wildcardMatches.length} ${results.wildcardMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las letras y ${wildcardCount} ${wildcardCount === 1 ? "comodín" : "comodines"}:`
                      )}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {wildcardCount === 0 ? (
                        results.exactMatches.map((word, index) => renderWordLink(word, index, 'exact'))
                      ) : (
                        results.wildcardMatches.map((word, index) => (
                          <a
                            key={`wildcard-${index}`}
                            href={`https://dle.rae.es/?w=${word}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
                          >
                            {highlightWildcardLetter(word, searchTerm)}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Second section: Results with one additional letter */}
                {results.additionalWildcardMatches.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {`${results.additionalWildcardMatches.length} ${results.additionalWildcardMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las letras más una letra adicional:`}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {results.additionalWildcardMatches.map((word, index) => (
                        <a
                          key={`additional-${index}`}
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

                {/* Third section: Shorter words */}
                {results.shorterMatches.size > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-600">
                      Palabras más cortas que se pueden formar:
                    </h3>
                    {Array.from(results.shorterMatches.entries())
                      .sort(([lenA], [lenB]) => lenB - lenA) // Sort by length descending
                      .map(([length, words]) => (
                        <div key={`shorter-${length}`} className="space-y-2">
                          <h4 className="font-medium text-gray-600">
                            {`Palabras de ${length} letras:`}
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {Array.from(words).map((word, index) => renderWordLink(word, index, `shorter-${length}`))}
                          </div>
                        </div>
                      ))}
                  </div>
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