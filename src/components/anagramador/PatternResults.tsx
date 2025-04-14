
import { BaseResults } from "./results/BaseResults";
import { useState, useEffect } from "react";
import { highlightPatternMatch } from "@/utils/wildcardHighlighting";
import { translateHyphenPattern } from "@/utils/pattern/translation";
import { processDigraphs } from "@/utils/digraphs";

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
  const translatedPattern = translateHyphenPattern(patternPart);
  const isEndPattern = translatedPattern.endsWith('$') || patternPart.startsWith('-') && !patternPart.endsWith('-');
  const isStartPattern = translatedPattern.startsWith('^') || patternPart.endsWith('-') && !patternPart.startsWith('-');
  const isContainsPattern = patternPart.startsWith('-') && patternPart.endsWith('-');
  const shouldExtendPattern = patternPart.endsWith('-');
  
  // Extract the actual pattern without hyphens and process digraphs for highlighting
  let cleanPattern = patternPart;
  if (isEndPattern && !isContainsPattern) {
    cleanPattern = patternPart.slice(1);
  }
  if (isStartPattern && !isContainsPattern) {
    cleanPattern = cleanPattern.slice(0, -1);
  }
  if (isContainsPattern) {
    cleanPattern = cleanPattern.slice(1, -1);
  }
  
  // Process the clean pattern for digraphs
  const processedCleanPattern = processDigraphs(cleanPattern);
  
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
