
import { BaseResults } from "./results/BaseResults";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
  showLongerWords?: boolean;
}

export const PatternResults = ({ matches, searchTerm, showLongerWords = false }: PatternResultsProps) => {
  // Remove duplicates using Set
  const uniqueMatches = Array.from(new Set(matches));

  return (
    <BaseResults
      matches={uniqueMatches}
      title={`${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      isLongerPatternMode={showLongerWords}
    />
  );
};
