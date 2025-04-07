
import { BaseResults } from "./results/BaseResults";

interface ShorterResultsProps {
  matches: string[];
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
  title: string;
}

export const ShorterResults = ({ matches, highlightWildcardLetter, searchTerm, title }: ShorterResultsProps) => {
  const isAdditionalLetterMode = title.includes("adicional");
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  
  return (
    <BaseResults
      matches={matches}
      title={title}
      highlightWildcardLetter={wildcardCount > 0 ? highlightWildcardLetter : undefined}
      searchTerm={searchTerm}
      isShortMode={!isAdditionalLetterMode}
    />
  );
};
