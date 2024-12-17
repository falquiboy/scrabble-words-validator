import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    patternMatches: string[];
  } | undefined;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
}

const ResultsList = ({ isLoading, searchTerm, results, highlightWildcardLetter }: ResultsListProps) => {
  const { toast } = useToast();
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const isPatternSearch = searchTerm.includes('/');

  // Group shorter words by length
  const groupedShorterWords = results?.additionalWildcardMatches.reduce((acc, word) => {
    const length = word.length;
    if (!acc[length]) {
      acc[length] = [];
    }
    acc[length].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort lengths in descending order
  const sortedLengths = Object.keys(groupedShorterWords || {})
    .map(Number)
    .sort((a, b) => b - a);

  const handleCopyAll = () => {
    if (!results) return;

    let allWords: string[] = [];

    // Collect all words based on search type
    if (isPatternSearch) {
      allWords = results.patternMatches;
    } else {
      if (wildcardCount === 0) {
        allWords = [...results.exactMatches];
      } else {
        allWords = [...results.wildcardMatches];
      }
      // Add shorter words if any
      if (results.additionalWildcardMatches.length > 0) {
        allWords = [...allWords, ...results.additionalWildcardMatches];
      }
    }

    // Copy to clipboard
    const text = allWords.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "¡Copiado!",
        description: `${allWords.length} palabras copiadas al portapapeles`,
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
          results.additionalWildcardMatches.length > 0
        ) ? (
          <>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopyAll}
              >
                <Copy className="h-4 w-4" />
                Copiar todo
              </Button>
            </div>

            {/* Pattern matches section */}
            {isPatternSearch && results.patternMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {`${results.patternMatches.length} ${results.patternMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.patternMatches.map((word, index) => (
                    <a
                      key={`pattern-${index}`}
                      href={`https://dle.rae.es/?w=${word}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
                    >
                      {word}
                    </a>
                  ))}
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
                        results.exactMatches.map((word, index) => (
                          <a
                            key={`exact-${index}`}
                            href={`https://dle.rae.es/?w=${word}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
                          >
                            {highlightWildcardLetter(word, searchTerm)}
                          </a>
                        ))
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

                {/* Shorter words section - grouped by length */}
                {results.additionalWildcardMatches.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">
                      {`${results.additionalWildcardMatches.length} ${results.additionalWildcardMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando algunas letras:`}
                    </h3>
                    {sortedLengths.map(length => (
                      <div key={`length-${length}`} className="space-y-2">
                        <h4 className="font-medium text-gray-600">
                          {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedShorterWords![length].length}):`}
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {groupedShorterWords![length].map((word, index) => (
                            <a
                              key={`shorter-${length}-${index}`}
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