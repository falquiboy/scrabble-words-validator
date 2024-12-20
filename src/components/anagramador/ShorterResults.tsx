import { processDigraphs } from "@/utils/digraphs";

interface ShorterResultsProps {
  matches: string[];
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
}

export const ShorterResults = ({ matches, highlightWildcardLetter, searchTerm }: ShorterResultsProps) => {
  if (matches.length === 0) return null;

  // Group shorter words by their digraph-aware length
  const groupedShorterWords = matches.reduce((acc, word) => {
    const processedWord = processDigraphs(word);
    const length = processedWord.length;
    if (!acc[length]) {
      acc[length] = [];
    }
    acc[length].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort lengths in descending order
  const sortedLengths = Object.keys(groupedShorterWords)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-4 pb-4">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando algunas letras:`}
      </h3>
      {sortedLengths.map(length => (
        <div key={`length-${length}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedShorterWords[length].length}):`}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groupedShorterWords[length].map((word, index) => (
              <a
                key={`shorter-${length}-${index}`}
                href={`https://dle.rae.es/?w=${word}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-100 p-1.5 rounded transition-colors text-lg w-full text-left"
              >
                <span className="flex items-center gap-2">
                  {highlightWildcardLetter(word, searchTerm)}
                  <span className="text-sm text-gray-500">({word.length})</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};