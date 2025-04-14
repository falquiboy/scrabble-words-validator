
import { BaseResults } from "./results/BaseResults";
import { useState, useEffect } from "react";
import { highlightPatternMatch } from "@/utils/highlighting";
import { translateHyphenPattern } from "@/utils/pattern/translation";
import { processDigraphs } from "@/utils/digraphs";
import { detectPatternType } from "@/utils/highlighting";

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
  
  // Check if this is a pattern with rack letters
  const hasRackLetters = searchTerm.includes(',');
  
  // Prepare pattern and rack parts for highlighting
  const [patternPart, rackPart] = hasRackLetters ? 
    searchTerm.split(',') : [searchTerm, ''];
  
  // Remove length filter if present in the pattern
  const cleanPatternPart = patternPart.replace(/:\d+$/, '');
  
  // For special patterns like -NAS, we need custom highlighting
  const patternTypeInfo = detectPatternType(cleanPatternPart);
  
  // Determine title based on the pattern type
  let titleText = "";
  if (patternTypeInfo.isContainsPattern) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que contienen "${patternTypeInfo.cleanPattern}"`;
  } else if (patternTypeInfo.isStartPattern) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que empiezan con "${patternTypeInfo.cleanPattern}"`;
  } else if (patternTypeInfo.isEndPattern) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que terminan con "${patternTypeInfo.cleanPattern}"`;
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
