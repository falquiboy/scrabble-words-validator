import { processDigraphs, getInternalLength } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
}

export const PatternResults = ({ matches, searchTerm }: PatternResultsProps) => {
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

  // Sort lengths in ascending order
  const sortedLengths = Object.keys(groupedByLength)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4 pb-8">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      </h3>
      {sortedLengths.map(length => (
        <div key={`length-${length}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedByLength[length].length}):`}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groupedByLength[length].map((word, index) => {
              const score = calculateWordScore(word);
              return (
                <a
                  key={`pattern-${length}-${index}`}
                  href={`https://dle.rae.es/?w=${word}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
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