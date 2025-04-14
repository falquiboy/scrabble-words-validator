import React from 'react';
import { processDigraphs } from '../digraphs';
import { findDigraphPositions } from './digraphUtils';

/**
 * Highlights letters in a word based on a wildcard search term
 */
export const highlightWildcardLetter = (word: string, searchTerm: string): React.ReactNode => {
  if (!word || !searchTerm) return word;

  // Remove length filter if present
  const cleanSearchTerm = searchTerm.replace(/\/\d+$/, '');

  // Process both the word and search term to handle digraphs
  const processedWord = processDigraphs(word);
  const processedSearch = processDigraphs(cleanSearchTerm.replace(/\*/g, ''));

  // Find digraph positions in the original word
  const digraphPositions = findDigraphPositions(word);

  // Create a map to track letter usage from the search term
  const letterUsage = new Map<string, number>();
  for (const char of processedSearch) {
    letterUsage.set(char, (letterUsage.get(char) || 0) + 1);
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
      if (letterUsage.has(processedDigraph) && letterUsage.get(processedDigraph)! > 0) {
        matchedIndices.add(digraph.start);
        matchedIndices.add(digraph.end);
        letterUsage.set(processedDigraph, letterUsage.get(processedDigraph)! - 1);
      }
    } else {
      const char = word[i];
      if (letterUsage.has(char) && letterUsage.get(char)! > 0) {
        matchedIndices.add(i);
        letterUsage.set(char, letterUsage.get(char)! - 1);
      }
    }
  }

  // Return the word with highlighted characters
  return <span className="inline-flex">
      {word.split('').map((char, index) => {
      // Find if this position is part of a digraph
      const digraph = digraphPositions.find(pos => pos?.start === index || pos?.end === index);

      // Check if this character or digraph is unmatched
      const isUnmatched = !matchedIndices.has(index);

      // Handle digraphs
      if (digraph) {
        if (index === digraph.start) {
          // Only render the digraph at its start position
          return isUnmatched ? <span key={index} className="text-red-600 font-semibold lowercase">
                {char}{word[index + 1]}
              </span> : <span key={index} className="font-semibold">
                {char}{word[index + 1]}
              </span>;
        } else if (index === digraph.end) {
          // Skip the second character of the digraph
          return null;
        }
      }

      // Handle regular characters
      return isUnmatched ? <span key={index} className="text-red-600 font-semibold lowercase">
            {char}
          </span> : <span key={index} className="font-normal">
            {char}
          </span>;
    })}
    </span>;
};