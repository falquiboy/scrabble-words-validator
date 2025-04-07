
import { BaseResults } from "./results/BaseResults";
import { useState, useEffect } from "react";
import { highlightPatternMatch } from "@/utils/wildcardHighlighting";
import { toDisplayFormat, processDigraphs } from "@/utils/digraphs";

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
  const isEndPattern = patternPart.startsWith('-') && !patternPart.endsWith('-');
  const isStartPattern = patternPart.endsWith('-') && !patternPart.startsWith('-');
  const isContainsPattern = patternPart.startsWith('-') && patternPart.endsWith('-');
  
  // Process the pattern part for highlighting (we need to preserve digraphs in the UI)
  const processedPatternPart = patternPart;
  
  console.log('Pattern type for highlighting:', { isEndPattern, isStartPattern, isContainsPattern, patternPart });
  
  const getHighlightFunction = (word: string) => {
    return highlightPatternMatch(word, processedPatternPart, rackPart);
  };
  
  return (
    <BaseResults
      matches={uniqueMatches}
      title={`${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que coinciden con el patrón:`}
      highlightWildcardLetter={hasRackLetters || isEndPattern || isStartPattern || isContainsPattern ? 
        getHighlightFunction : undefined}
      searchTerm={searchTerm}
      sortAscending={showLongerWords}
    />
  );
};
