
import { BaseResults } from "./results/BaseResults";

interface ShorterResultsProps {
  matches: string[];
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
  title: string;
}

export const ShorterResults = ({ matches, highlightWildcardLetter, searchTerm, title }: ShorterResultsProps) => {
  return (
    <BaseResults
      matches={matches}
      title={title}
      highlightWildcardLetter={highlightWildcardLetter}
      searchTerm={searchTerm}
      isShortMode={true}
    />
  );
};
