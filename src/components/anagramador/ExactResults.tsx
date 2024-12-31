import { BaseResults } from "./results/BaseResults";

interface ExactResultsProps {
  matches: string[];
  wildcardCount: number;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
}

export const ExactResults = ({ matches, wildcardCount, highlightWildcardLetter, searchTerm }: ExactResultsProps) => {
  return (
    <BaseResults
      matches={matches}
      title={`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las fichas:`}
      highlightWildcardLetter={highlightWildcardLetter}
      searchTerm={searchTerm}
    />
  );
};