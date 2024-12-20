interface ExactResultsProps {
  matches: string[];
  wildcardCount: number;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
}

export const ExactResults = ({ matches, wildcardCount, highlightWildcardLetter, searchTerm }: ExactResultsProps) => {
  if (matches.length === 0) return null;

  return (
    <div className="space-y-2 pb-4">
      <h3 className="font-semibold text-lg">
        {wildcardCount === 0 ? (
          `${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las letras:`
        ) : (
          `${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las letras y ${wildcardCount} ${wildcardCount === 1 ? "comodín" : "comodines"}:`
        )}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {matches.map((word, index) => (
          <a
            key={`exact-${index}`}
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
  );
};