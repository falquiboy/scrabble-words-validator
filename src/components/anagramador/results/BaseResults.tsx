import { processDigraphs, getInternalLength, toDisplayFormat } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";

interface BaseResultsProps {
  matches: string[];
  title: string;
  highlightWildcardLetter?: (word: string, originalWord: string) => React.ReactNode;
  searchTerm?: string;
  isShortMode?: boolean;
  sortAscending?: boolean;
}

export const BaseResults = ({ 
  matches, 
  title, 
  highlightWildcardLetter, 
  searchTerm, 
  isShortMode,
  sortAscending = false
}: BaseResultsProps) => {
  if (matches.length === 0) return null;

  // Group words by internal length
  const groupedByLength = matches.reduce((acc, word) => {
    const length = getInternalLength(word);
    if (!acc[length]) {
      acc[length] = [];
    }
    acc[length].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort lengths based on sortAscending prop
  const sortedLengths = Object.keys(groupedByLength)
    .map(Number)
    .sort((a, b) => sortAscending ? a - b : b - a);

  return (
    <div className="space-y-4 pb-8">
      <h3 className="font-semibold text-lg">
        {title.includes("adicional") 
          ? `${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las fichas más una letra adicional:` 
          : `${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"}${isShortMode ? "" : " usando todas las fichas"}:`
        }
      </h3>
      {sortedLengths.map(length => (
        <div key={`length-${length}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedByLength[length].length}):`}
          </h4>
          <div className="flex flex-wrap gap-2">
            {groupedByLength[length].map((word, index) => {
              const displayWord = toDisplayFormat(word);
              const score = calculateWordScore(displayWord);
              return (
                <a
                  key={`word-${length}-${index}`}
                  href={`https://dle.rae.es/?w=${displayWord}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-gray-100 p-1.5 rounded transition-colors text-lg tracking-wide"
                >
                  <span className="flex items-center gap-2">
                    {highlightWildcardLetter && searchTerm 
                      ? highlightWildcardLetter(displayWord, searchTerm)
                      : displayWord.split('').map((char, i) => 
                          char === 'I' 
                            ? <span key={i} className="font-mono">{char}</span>
                            : char
                        )}
                    <span className="text-sm text-gray-500">({score})</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
