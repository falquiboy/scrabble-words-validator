import { processDigraphs } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";

interface ShorterResultsProps {
  matches: string[];
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
}

export const ShorterResults = ({ matches, highlightWildcardLetter, searchTerm }: ShorterResultsProps) => {
  if (matches.length === 0) return null;

  // Group shorter words by their nominal value
  const groupedShorterWords = matches.reduce((acc, word) => {
    const score = calculateWordScore(word);
    if (!acc[score]) {
      acc[score] = [];
    }
    acc[score].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort scores in descending order
  const sortedScores = Object.keys(groupedShorterWords)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-4 pb-8">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando algunas letras:`}
      </h3>
      {sortedScores.map(score => (
        <div key={`score-${score}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${score} ${score === 1 ? 'punto' : 'puntos'} (${groupedShorterWords[score].length}):`}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groupedShorterWords[score].map((word, index) => (
              <a
                key={`shorter-${score}-${index}`}
                href={`https://dle.rae.es/?w=${word}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
              >
                <span className="flex items-center gap-2">
                  {highlightWildcardLetter(word, searchTerm)}
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