interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
}

export const PatternResults = ({ matches, searchTerm }: PatternResultsProps) => {
  if (matches.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">
        {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {matches.map((word, index) => (
          <a
            key={`pattern-${index}`}
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
  );
};