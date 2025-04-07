
import { BaseResults } from "./results/BaseResults";
import { useState, useEffect } from "react";
import { highlightPatternMatch } from "@/utils/wildcardHighlighting";

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
  
  // For special patterns like -NAS, we need custom highlighting
  const isEndPattern = patternPart.startsWith('-');
  const isStartPattern = patternPart.endsWith('-');
  const isContainsPattern = patternPart.startsWith('-') && patternPart.endsWith('-');
  
  // Extract the actual pattern without hyphens for highlighting
  let cleanPattern = patternPart;
  if (isEndPattern) {
    cleanPattern = patternPart.slice(1);
  }
  if (isStartPattern && !isContainsPattern) {
    cleanPattern = cleanPattern.slice(0, -1);
  }
  if (isContainsPattern) {
    cleanPattern = cleanPattern.slice(1, -1);
  }
  
  return (
    <BaseResults
      matches={uniqueMatches}
      title={`${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      highlightWildcardLetter={hasRackLetters ? 
        (word) => highlightPatternMatch(word, patternPart, rackPart) : 
        undefined}
      searchTerm={searchTerm}
      sortAscending={showLongerWords}
    />
  );
};
