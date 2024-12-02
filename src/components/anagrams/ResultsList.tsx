import { ScrollArea } from "@/components/ui/scroll-area";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
  } | undefined;
}

const ResultsList = ({ isLoading, searchTerm, results }: ResultsListProps) => {
  const highlightWildcardLetter = (word: string, originalWord: string) => {
    if (word.length <= originalWord.length) return word;
    
    const wordLetters = word.split('');
    const originalLetters = [...originalWord];
    
    let remainingOriginal = [...originalLetters];
    let extraLetter = '';
    let extraLetterLastIndex = -1;
    
    // Find which letter in word is the extra one
    wordLetters.forEach((letter, index) => {
      const matchIndex = remainingOriginal.indexOf(letter);
      if (matchIndex === -1) {
        extraLetter = letter;
        extraLetterLastIndex = word.lastIndexOf(letter);
      } else {
        remainingOriginal.splice(matchIndex, 1);
      }
    });
    
    return (
      <>
        {word.slice(0, extraLetterLastIndex)}
        <span className="text-blue-500 font-bold">{word[extraLetterLastIndex]}</span>
        {word.slice(extraLetterLastIndex + 1)}
      </>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] mt-4">
      <div className="space-y-4 pr-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            Buscando anagramas...
          </div>
        ) : results && (results.exactMatches.length > 0 || results.wildcardMatches.length > 0) ? (
          <>
            {results.exactMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {results.exactMatches.length} {results.exactMatches.length === 1 ? "anagrama" : "anagramas"} encontrados:
                </h3>
                <div>
                  {results.exactMatches.map((word, index) => (
                    <a
                      key={`exact-${index}`}
                      href={`https://dle.rae.es/?w=${word}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-100 p-2 rounded transition-colors text-lg"
                    >
                      {word}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {results.wildcardMatches.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {results.wildcardMatches.length} {results.wildcardMatches.length === 1 ? "palabra" : "palabras"} encontradas usando una letra adicional:
                </h3>
                <div>
                  {results.wildcardMatches.map((word, index) => (
                    <a
                      key={`wildcard-${index}`}
                      href={`https://dle.rae.es/?w=${word}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-100 p-2 rounded transition-colors text-lg"
                    >
                      {highlightWildcardLetter(word, searchTerm)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : searchTerm ? (
          <p className="text-gray-500">No se encontraron palabras.</p>
        ) : null}
      </div>
    </ScrollArea>
  );
};

export default ResultsList;