
import { BaseResults } from "./results/BaseResults";
import { highlightPatternMatch } from "@/utils/wildcardHighlighting";
import { parseUserQuery } from "@/utils/queryLanguage.mjs";

interface PatternResultsProps {
  matches: string[];
  searchTerm: string;
  showLongerWords?: boolean;
}

export const PatternResults = ({ 
  matches, 
  searchTerm,
  showLongerWords = false
}: PatternResultsProps) => {
  // Remove duplicates using Set
  const uniqueMatches = Array.from(new Set(matches));
  
  const query = parseUserQuery(searchTerm);
  const patternPart = query.pattern;
  const rackPart = query.rack;
  const hasRackLetters = !!rackPart;
  const visiblePattern = patternPart.replace(/^\*/, '').replace(/\*$/, '');
  
  // Determine title based on the pattern type
  let titleText = "";
  if (patternPart === '*' && !query.hasConstraints && query.length !== null) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra" : "palabras"} de ${query.length} fichas`;
  } else if (patternPart === '*') {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que cumplen las restricciones`;
  } else if (patternPart.startsWith('*') && patternPart.endsWith('*') && patternPart.length > 1) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que contienen "${visiblePattern}"`;
  } else if (patternPart.endsWith('*')) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que empiezan con "${visiblePattern}"`;
  } else if (patternPart.startsWith('*')) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que terminan con "${visiblePattern}"`;
  } else {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón`;
  }
  
  return (
    <BaseResults
      matches={uniqueMatches}
      title={titleText}
      highlightWildcardLetter={hasRackLetters ? 
        (word) => highlightPatternMatch(word, patternPart, rackPart) : 
        (word) => highlightPatternMatch(word, patternPart, "")}
      searchTerm={searchTerm}
      sortAscending={showLongerWords}
    />
  );
};
