
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
  
  // Remove length filter if present in the pattern
  const cleanPatternPart = patternPart.replace(/:\d+$/, '');
  
  // For special patterns like -NAS, we need custom highlighting
  const translatedPattern = translateHyphenPattern(cleanPatternPart);
  const isEndPattern = translatedPattern.endsWith('$') || cleanPatternPart.startsWith('-') && !cleanPatternPart.endsWith('-');
  const isStartPattern = translatedPattern.startsWith('^') || cleanPatternPart.endsWith('-') && !cleanPatternPart.startsWith('-');
  const isContainsPattern = cleanPatternPart.startsWith('-') && cleanPatternPart.endsWith('-');
  
  // Extract the actual pattern without hyphens for display purposes
  let cleanPattern = cleanPatternPart;
  if (isEndPattern && !isContainsPattern) {
    cleanPattern = cleanPatternPart.slice(1);
  }
  if (isStartPattern && !isContainsPattern) {
    cleanPattern = cleanPattern.slice(0, -1);
  }
  if (isContainsPattern) {
    cleanPattern = cleanPattern.slice(1, -1);
  }
  
  // Process the clean pattern for digraphs
  const processedCleanPattern = processDigraphs(cleanPattern);
  
  // Determine title based on the pattern type
  let titleText = "";
  if (isContainsPattern) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que contienen "${cleanPattern}"`;
  } else if (isStartPattern) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que empiezan con "${cleanPattern}"`;
  } else if (isEndPattern) {
    titleText = `${uniqueMatches.length} ${uniqueMatches.length === 1 ? "palabra encontrada" : "palabras encontradas"} que terminan con "${cleanPattern}"`;
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
