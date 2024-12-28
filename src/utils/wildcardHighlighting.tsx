import React from 'react';

/**
 * Highlights all letters in red
 */
export const highlightWildcardLetter = (word: string, searchTerm: string): React.ReactNode => {
  const wordChars = word.split('');
  
  return (
    <span className="inline-flex">
      {wordChars.map((char, index) => (
        <span key={index} className="text-red-600 font-semibold">
          {char}
        </span>
      ))}
    </span>
  );
};