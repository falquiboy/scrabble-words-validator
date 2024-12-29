import { processDigraphs, getInternalLength } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
}

export const PatternResults = ({ matches, searchTerm }: PatternResultsProps) => {
  if (matches.length === 0) return null;

  // Remove duplicates using Set
  const uniqueMatches = Array.from(new Set(matches));

  // Group unique words by internal length
  const groupedByLength = uniqueMatches.reduce((acc, word) => {
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
        {`${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
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
                  key={`pattern-${length}-${index}`}
                  href={`https://dle.rae.es/?w=${word}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-gray-100 p-1.5 rounded transition-colors text-lg"
                >
                  <span className="flex items-center gap-2">
                    {word}
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