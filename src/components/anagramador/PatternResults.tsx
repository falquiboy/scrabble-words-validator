import BaseResults from "./results/BaseResults";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
}

export const PatternResults = ({ matches, searchTerm }: PatternResultsProps) => {
  // Remove duplicates using Set
  const uniqueMatches = Array.from(new Set(matches));

  return (
    <BaseResults
      matches={uniqueMatches}
      title={`${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      highlightWildcardLetter={(word) => word}
      searchTerm={searchTerm}
    />
  );
};