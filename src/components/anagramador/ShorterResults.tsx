import { processDigraphs, getInternalLength } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";

interface ShorterResultsProps {
  matches: string[];
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
}

export const ShorterResults = ({ matches, highlightWildcardLetter, searchTerm }: ShorterResultsProps) => {
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

  // Sort lengths in descending order
  const sortedLengths = Object.keys(groupedByLength)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-4 pb-8">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando algunas letras:`}
      </h3>
      {sortedLengths.map(length => (
        <div key={`length-${length}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedByLength[length].length}):`}
          </h4>
          <div className="flex flex-wrap gap-2">
            {groupedByLength[length].map((word, index) => {
              const score = calculateWordScore(word);
              return (
                <a
                  key={`shorter-${length}-${index}`}
                  href={`https://dle.rae.es/?w=${word}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-gray-100 p-1.5 rounded transition-colors text-lg"
                >
                  <span className="flex items-center gap-2">
                    {highlightWildcardLetter(word, searchTerm)}
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