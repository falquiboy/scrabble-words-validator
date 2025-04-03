
import { BaseResults } from "./results/BaseResults";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
  isLongerWordsMode?: boolean;
}

export const PatternResults = ({ matches, searchTerm, isLongerWordsMode }: PatternResultsProps) => {
  // Remove duplicates using Set
  const uniqueMatches = Array.from(new Set(matches));

  // Sort by length from shortest to longest if in longer words mode
  const sortedMatches = isLongerWordsMode 
    ? [...uniqueMatches].sort((a, b) => a.length - b.length)
    : uniqueMatches;

  return (
    <BaseResults
      matches={sortedMatches}
      title={`${sortedMatches.length} ${sortedMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
    />
  );
};
