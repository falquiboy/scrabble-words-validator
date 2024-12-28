import React from 'react';
import { processDigraphs, toDisplayFormat } from './digraphs';

/**
 * Highlights wildcard letters and additional letters in red
 */
export const highlightWildcardLetter = (word: string, searchTerm: string): React.ReactNode => {
  // Remove length filter if present
  const cleanSearchTerm = searchTerm.replace(/\/\d+$/, '');
  
  // Process digraphs in both strings
  const processedWord = processDigraphs(word);
  const processedSearchTerm = processDigraphs(cleanSearchTerm.replace(/\*/g, ''));
  
  // Convert processed strings to arrays for comparison
  const processedWordChars = processedWord.split('');
  const processedSearchChars = processedSearchTerm.split('');
  
  // Create a map of character counts in the search term
  const searchCharCounts = new Map<string, number>();
  processedSearchChars.forEach(char => {
    searchCharCounts.set(char, (searchCharCounts.get(char) || 0) + 1);
  });
  
  // Track which characters have been matched
  const matchedIndices = new Set<number>();
  
  // First pass: mark exact matches from left to right
  processedWordChars.forEach((char, index) => {
    if (searchCharCounts.has(char) && searchCharCounts.get(char)! > 0) {
      matchedIndices.add(index);
      searchCharCounts.set(char, searchCharCounts.get(char)! - 1);
    }
  });

  // Convert back to display format for rendering
  const displayWord = toDisplayFormat(word);
  const displayChars = displayWord.split('');
  
  // Track digraph positions and process them
  const digraphPositions = new Set<number>();
  let i = 0;
  while (i < displayChars.length - 1) {
    const pair = displayChars[i] + displayChars[i + 1];
    if (['CH', 'LL', 'RR'].includes(pair)) {
      const processedIndex = Math.floor(i / 2);
      // If this digraph position is not matched in the processed word
      if (!matchedIndices.has(processedIndex)) {
        digraphPositions.add(i);
        digraphPositions.add(i + 1);
      }
      i += 2;
    } else {
      i++;
    }
  }
  
  // Return the word with highlighted characters
  return (
    <span className="inline-flex">
      {displayChars.map((char, index) => {
        const processedIndex = Math.floor(index / 2);
        const isWildcardMatch = cleanSearchTerm.includes('*') && !matchedIndices.has(processedIndex);
        const isAdditionalLetter = !matchedIndices.has(processedIndex);
        const isPartOfHighlightedDigraph = digraphPositions.has(index);
        
        if (isWildcardMatch || isAdditionalLetter || isPartOfHighlightedDigraph) {
          // Highlight both wildcard matches and additional letters in red
          return <span key={index} className="text-red-600 font-semibold">{char}</span>;
        } else {
          // Keep other letters in default color
          return <span key={index}>{char}</span>;
        }
      })}
    </span>
  );
};