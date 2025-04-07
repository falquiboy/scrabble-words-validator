
import { BaseResults } from "./results/BaseResults";

interface ExactResultsProps {
  matches: string[];
  wildcardCount: number;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
  isShortMode?: boolean;
}

export const ExactResults = ({ matches, wildcardCount, highlightWildcardLetter, searchTerm, isShortMode }: ExactResultsProps) => {
  return (
    <BaseResults
      matches={matches}
      title={`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las fichas:`}
      highlightWildcardLetter={wildcardCount > 0 ? highlightWildcardLetter : undefined}
      searchTerm={searchTerm}
      isShortMode={isShortMode}
    />
  );
};
