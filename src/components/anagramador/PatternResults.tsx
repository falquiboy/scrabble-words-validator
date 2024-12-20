import { processDigraphs } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
}

export const PatternResults = ({ matches, searchTerm }: PatternResultsProps) => {
  if (matches.length === 0) return null;

  // Group words by nominal value (score)
  const groupedWords = matches.reduce((acc, word) => {
    const score = calculateWordScore(word);
    if (!acc[score]) {
      acc[score] = [];
    }
    acc[score].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort scores in ascending order
  const sortedScores = Object.keys(groupedWords)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4 pb-8">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      </h3>
      {sortedScores.map(score => (
        <div key={`score-${score}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${score} ${score === 1 ? 'punto' : 'puntos'} (${groupedWords[score].length}):`}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groupedWords[score].map((word, index) => (
              <a
                key={`pattern-${score}-${index}`}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};