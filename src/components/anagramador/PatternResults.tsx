interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
}

export const PatternResults = ({ matches, searchTerm }: PatternResultsProps) => {
  if (matches.length === 0) return null;

  // Group words by length
  const groupedWords = matches.reduce((acc, word) => {
    const length = word.length;
    if (!acc[length]) {
      acc[length] = [];
    }
    acc[length].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort lengths in ascending order
  const sortedLengths = Object.keys(groupedWords)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      </h3>
      {sortedLengths.map(length => (
        <div key={`length-${length}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedWords[length].length}):`}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groupedWords[length].map((word, index) => (
              <a
                key={`pattern-${length}-${index}`}
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
      ))}
    </div>
  );
};