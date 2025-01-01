import { BaseResults } from "./results/BaseResults";

interface ShorterResultsProps {
  matches: string[];
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
  title: string;
  showTitle: boolean;
}

export const ShorterResults = ({ matches, highlightWildcardLetter, searchTerm, title, showTitle }: ShorterResultsProps) => {
  return (
    <BaseResults
      matches={matches}
      title={showTitle ? title : undefined}
      highlightWildcardLetter={highlightWildcardLetter}
      searchTerm={searchTerm}
    />
  );
};