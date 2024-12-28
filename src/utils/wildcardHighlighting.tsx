import React from 'react';

/**
 * Highlights wildcard letters and additional letters in red
 */
export const highlightWildcardLetter = (word: string, searchTerm: string): React.ReactNode => {
  // Remove length filter if present
  const cleanSearchTerm = searchTerm.replace(/\/\d+$/, '');
  
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
    if (searchCharCounts.has(char) && searchCharCounts.get(char)! > 0) {
      matchedIndices.add(index);
      searchCharCounts.set(char, searchCharCounts.get(char)! - 1);
    }
  });
  
  // Return the word with highlighted characters
  return (
    <span className="inline-flex">
      {wordChars.map((char, index) => {
        const isWildcardMatch = cleanSearchTerm.includes('*') && !matchedIndices.has(index);
        const isAdditionalLetter = !matchedIndices.has(index);
        
        if (isWildcardMatch || isAdditionalLetter) {
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