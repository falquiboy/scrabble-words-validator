import React from 'react';
import { processDigraphs } from './digraphs';

const findDigraphPositions = (word: string): { start: number, end: number }[] => {
  const positions: { start: number, end: number }[] = [];
  const chars = word.split('');
  
  for (let i = 0; i < chars.length - 1; i++) {
    if (
      (chars[i] === 'C' && chars[i + 1] === 'H') ||
      (chars[i] === 'L' && chars[i + 1] === 'L') ||
      (chars[i] === 'R' && chars[i + 1] === 'R')
    ) {
      positions.push({ start: i, end: i + 1 });
      i++; // Skip next character as it's part of the digraph
    }
  }
  
  return positions;
};

export const highlightWildcardLetter = (word: string, searchTerm: string): React.ReactNode => {
  if (!word || !searchTerm) return word;

  // Remove length filter if present
  const cleanSearchTerm = searchTerm.replace(/\/\d+$/, '');
  
  // Process both the word and search term to handle digraphs
  const processedWord = processDigraphs(word);
  const processedSearch = processDigraphs(cleanSearchTerm.replace(/\*/g, ''));
  
  // Find digraph positions in the original word
  const digraphPositions = findDigraphPositions(word);
  
  // Create a map of character counts in the processed search term
  const searchCharCounts = new Map<string, number>();
  for (const char of processedSearch) {
    searchCharCounts.set(char, (searchCharCounts.get(char) || 0) + 1);
  }
  
  // Track which characters have been matched
  const matchedIndices = new Set<number>();
  
  // First pass: mark exact matches
  for (let i = 0; i < word.length; i++) {
    // Skip if this index is part of an already matched digraph
    if (matchedIndices.has(i)) continue;
    
    // Check if this position is part of a digraph
    const digraph = digraphPositions.find(pos => pos.start === i || pos.end === i);
    
    if (digraph) {
      const digraphStr = word.slice(digraph.start, digraph.end + 1);
      const processedDigraph = processDigraphs(digraphStr);
      
      if (searchCharCounts.has(processedDigraph) && searchCharCounts.get(processedDigraph)! > 0) {
        matchedIndices.add(digraph.start);
        matchedIndices.add(digraph.end);
        searchCharCounts.set(processedDigraph, searchCharCounts.get(processedDigraph)! - 1);
      }
    } else {
      const char = word[i];
      if (searchCharCounts.has(char) && searchCharCounts.get(char)! > 0) {
        matchedIndices.add(i);
        searchCharCounts.set(char, searchCharCounts.get(char)! - 1);
      }
    }
  }
  
  // Return the word with highlighted characters
  return (
    <span className="inline-flex">
      {word.split('').map((char, index) => {
        // Find if this position is part of a digraph
        const digraph = digraphPositions.find(pos => pos?.start === index || pos?.end === index);
        
        // Only highlight if this is a wildcard match or an additional letter
        const isWildcardMatch = cleanSearchTerm.includes('*');
        const isUnmatched = !matchedIndices.has(index);
        
        // Determine if this character should be highlighted
        const shouldHighlight = isUnmatched && 
          (isWildcardMatch || !cleanSearchTerm.includes(char)) &&
          (!digraph || (!matchedIndices.has(digraph.start) && !matchedIndices.has(digraph.end)));
        
        // Handle digraphs
        if (digraph) {
          if (index === digraph.start) {
            // Only render the digraph at its start position
            return shouldHighlight ? (
              <span key={index} className="text-red-600 font-semibold">
                {char}{word[index + 1]}
              </span>
            ) : (
              <span key={index}>{char}{word[index + 1]}</span>
            );
          } else if (index === digraph.end) {
            // Skip the second character of the digraph
            return null;
          }
        }
        
        // Handle regular characters
        return shouldHighlight ? (
          <span key={index} className="text-red-600 font-semibold">{char}</span>
        ) : (
          <span key={index}>{char}</span>
        );
      })}
    </span>
  );
};