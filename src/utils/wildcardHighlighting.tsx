import React from 'react';
import { processDigraphs } from './digraphs';

/**
 * Identifies digraph positions in a word
 */
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

/**
 * Highlights wildcard letters and additional letters in red, properly handling digraphs
 */
export const highlightWildcardLetter = (word: string, searchTerm: string): React.ReactNode => {
  // Remove length filter if present
  const cleanSearchTerm = searchTerm.replace(/\/\d+$/, '');
  
  // Find digraph positions in the word
  const digraphPositions = findDigraphPositions(word);
  
  // Convert strings to arrays for easier comparison
  const wordChars = word.split('');
  const searchChars = cleanSearchTerm.replace(/\*/g, '').split('');
  
  // Create a map of character counts in the search term
  const searchCharCounts = new Map<string, number>();
  searchChars.forEach(char => {
    searchCharCounts.set(char, (searchCharCounts.get(char) || 0) + 1);
  });
  
  // Track which characters have been matched
  const matchedIndices = new Set<number>();
  
  // First pass: mark exact matches from left to right
  wordChars.forEach((char, index) => {
    // Skip if this index is part of an already matched digraph
    if (matchedIndices.has(index)) return;
    
    // Check if this position is part of a digraph
    const digraph = digraphPositions.find(pos => pos.start === index || pos.end === index);
    
    if (digraph) {
      // Handle digraph matching
      const digraphStr = wordChars[digraph.start] + wordChars[digraph.end];
      const processedDigraph = processDigraphs(digraphStr);
      
      if (searchCharCounts.has(processedDigraph) && searchCharCounts.get(processedDigraph)! > 0) {
        // Match found for digraph
        matchedIndices.add(digraph.start);
        matchedIndices.add(digraph.end);
        searchCharCounts.set(processedDigraph, searchCharCounts.get(processedDigraph)! - 1);
      }
    } else if (searchCharCounts.has(char) && searchCharCounts.get(char)! > 0) {
      // Regular character match
      matchedIndices.add(index);
      searchCharCounts.set(char, searchCharCounts.get(char)! - 1);
    }
  });
  
  // Return the word with highlighted characters
  return (
    <span className="inline-flex">
      {wordChars.map((char, index) => {
        // Check if this position is part of a digraph
        const digraph = digraphPositions.find(pos => pos.start === index || pos.end === index);
        
        // Only highlight if this is a wildcard match or an additional letter
        const isWildcardMatch = cleanSearchTerm.includes('*');
        const isUnmatched = !matchedIndices.has(index);
        
        // Determine if this character should be highlighted
        const shouldHighlight = isUnmatched && 
          (isWildcardMatch || !searchTerm.includes(char)) &&
          // For digraphs, highlight only if both characters are unmatched
          (!digraph || (!matchedIndices.has(digraph.start) && !matchedIndices.has(digraph.end)));
        
        if (shouldHighlight) {
          // If it's part of a digraph and needs highlighting, highlight both characters
          if (digraph && (index === digraph.start)) {
            return (
              <span key={index} className="text-red-600 font-semibold">
                {char}{wordChars[index + 1]}
              </span>
            );
          } else if (digraph && index === digraph.end) {
            // Skip the second character of highlighted digraph
            return null;
          } else {
            // Regular character highlight
            return <span key={index} className="text-red-600 font-semibold">{char}</span>;
          }
        } else {
          // Not highlighted
          if (digraph && index === digraph.start) {
            // Show complete unhighlighted digraph
            return <span key={index}>{char}{wordChars[index + 1]}</span>;
          } else if (digraph && index === digraph.end) {
            // Skip the second character of unhighlighted digraph
            return null;
          } else {
            // Regular character
            return <span key={index}>{char}</span>;
          }
        }
      })}
    </span>
  );
};