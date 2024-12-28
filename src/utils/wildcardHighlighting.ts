import React from 'react';

/**
 * Highlights the letter that corresponds to the wildcard position in the search term
 * or the additional letter in extended matches
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
  
  // First pass: mark exact matches
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
        if (matchedIndices.has(index)) {
          return <span key={index}>{char}</span>;
        } else if (cleanSearchTerm.includes('*')) {
          // Highlight wildcard matches in blue
          return <span key={index} className="text-blue-600 font-semibold">{char}</span>;
        } else {
          // Highlight additional letters in green
          return <span key={index} className="text-green-600 font-semibold">{char}</span>;
        }
      })}
    </span>
  );
};