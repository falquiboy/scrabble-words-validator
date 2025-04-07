
import React from 'react';
import { processDigraphs, toDisplayFormat } from './digraphs';

// Helper function to create spans with proper classes for highlighting
const createHighlightedSpans = (
  characters: string[], 
  highlightedIndices: Set<number>, 
  highlightClass: string
) => {
  return characters.map((char, index) => {
    const isHighlighted = highlightedIndices.has(index);
    
    return (
      <span 
        key={index} 
        className={isHighlighted ? highlightClass : ''}
      >
        {char}
      </span>
    );
  });
};

/**
 * Highlights letters that match wildcards.
 * Takes the original word and the original rack, and highlights
 * the letters in the word that match wildcards.
 */
export const highlightWildcardLetter = (word: string, originalRack: string) => {
  if (!word || !originalRack) {
    return word;
  }
  
  // If no wildcards, return plain word
  if (!originalRack.includes('*')) {
    return word;
  }
  
  // Get regular letters (non-wildcards) from the rack
  const regularLetters = originalRack.replace(/\*/g, '').split('');
  
  // Convert word to array of characters
  const wordChars = word.split('');
  
  // Create a copy of regularLetters that we'll modify
  const availableLetters = [...regularLetters];
  
  // Track which indices to highlight
  const highlightIndices = new Set<number>();
  
  // First pass: mark letters from the rack as used (not highlighted)
  wordChars.forEach((char, index) => {
    const letterIndex = availableLetters.findIndex(l => l.toUpperCase() === char.toUpperCase());
    if (letterIndex >= 0) {
      // This letter is from the rack, not a wildcard
      availableLetters.splice(letterIndex, 1);
    } else {
      // This letter might be from a wildcard
      highlightIndices.add(index);
    }
  });
  
  // Render highlighted spans
  return createHighlightedSpans(
    wordChars, 
    highlightIndices, 
    'text-blue-600 font-bold'
  );
};

/**
 * Highlights letters in a word that match a pattern
 * Used for pattern searches (e.g. A??A matches ALBA)
 */
export const highlightPatternMatch = (word: string, pattern: string, rackLetters: string = '') => {
  if (!word || !pattern) {
    return word;
  }
  
  // Handle special patterns
  let effectivePattern = pattern;
  let isStartPattern = false;
  let isEndPattern = false;
  let isContainsPattern = false;
  
  // Detect pattern type
  if (pattern.startsWith('-') && !pattern.endsWith('-')) {
    // End pattern: -TOR matches words ending with TOR
    isEndPattern = true;
    effectivePattern = pattern.slice(1);
  } else if (pattern.endsWith('-') && !pattern.startsWith('-')) {
    // Start pattern: TOR- matches words starting with TOR
    isStartPattern = true;
    effectivePattern = pattern.slice(0, -1);
  } else if (pattern.startsWith('-') && pattern.endsWith('-')) {
    // Contains pattern: -TOR- matches words containing TOR
    isContainsPattern = true;
    effectivePattern = pattern.slice(1, -1);
  }
  
  // Convert both word and pattern to arrays of characters for matching
  const wordChars = word.split('');
  const patternChars = effectivePattern.split('');
  
  // Set to track which indices should be highlighted
  const highlightIndices = new Set<number>();
  
  // Handle different pattern types
  if (isStartPattern) {
    // Highlight characters that match the start pattern
    for (let i = 0; i < patternChars.length && i < wordChars.length; i++) {
      if (patternChars[i] !== '?' && 
          patternChars[i].toUpperCase() === wordChars[i].toUpperCase()) {
        highlightIndices.add(i);
      }
    }
  } else if (isEndPattern) {
    // Highlight characters that match the end pattern
    const offset = wordChars.length - patternChars.length;
    if (offset >= 0) {
      for (let i = 0; i < patternChars.length; i++) {
        if (patternChars[i] !== '?' && 
            patternChars[i].toUpperCase() === wordChars[i + offset].toUpperCase()) {
          highlightIndices.add(i + offset);
        }
      }
    }
  } else if (isContainsPattern) {
    // For contains pattern, find the substring in the word
    const patternText = effectivePattern.replace(/\?/g, '.');
    const regex = new RegExp(patternText, 'i');
    const match = word.match(regex);
    
    if (match && match.index !== undefined) {
      const startIndex = match.index;
      const matchedText = match[0];
      
      // Highlight only the non-wildcard characters from the pattern
      for (let i = 0; i < matchedText.length; i++) {
        const patternCharIndex = i;
        if (patternCharIndex < patternChars.length && 
            patternChars[patternCharIndex] !== '?' && 
            patternChars[patternCharIndex].toUpperCase() === matchedText[i].toUpperCase()) {
          highlightIndices.add(startIndex + i);
        }
      }
    }
  } else {
    // Regular pattern match - handle digraphs properly
    // We need to check for special patterns like ??CH??
    
    // First convert any digraphs in the pattern for comparisons
    // Important: For patterns with digraphs like CH, we need special handling
    const digraphMap: {[key: string]: string[]} = {
      'CH': ['C', 'H'],
      'LL': ['L', 'L'],
      'RR': ['R', 'R']
    };
    
    // Iterate over the pattern and find matches
    let patternIndex = 0;
    let wordIndex = 0;
    
    while (patternIndex < patternChars.length && wordIndex < wordChars.length) {
      // Check for digraphs in the pattern
      let isDigraph = false;
      
      // Look for digraphs (CH, LL, RR)
      for (const [digraph, chars] of Object.entries(digraphMap)) {
        if (patternIndex < patternChars.length - 1 && 
            patternChars[patternIndex] === chars[0] && 
            patternChars[patternIndex + 1] === chars[1]) {
            
          // We found a digraph in the pattern
          isDigraph = true;
          
          // Check if the word has the same digraph at this position
          if (wordIndex < wordChars.length - 1 && 
              wordChars[wordIndex] === chars[0] && 
              wordChars[wordIndex + 1] === chars[1]) {
            
            // Highlight both characters of the digraph
            highlightIndices.add(wordIndex);
            highlightIndices.add(wordIndex + 1);
            
            // Advance both indices
            patternIndex += 2;
            wordIndex += 2;
            break;
          }
        }
      }
      
      if (!isDigraph) {
        // Handle normal character or wildcard
        if (patternChars[patternIndex] === '?') {
          // Wildcard - don't highlight but advance indices
          patternIndex++;
          wordIndex++;
        } else if (patternChars[patternIndex].toUpperCase() === wordChars[wordIndex].toUpperCase()) {
          // Regular character match
          highlightIndices.add(wordIndex);
          patternIndex++;
          wordIndex++;
        } else {
          // No match, just advance word index
          wordIndex++;
        }
      }
    }
  }
  
  // If we have rack letters, we need to highlight those separately
  if (rackLetters) {
    // Apply rack letter highlights
    // This is for combined pattern+rack searches
    // For now just use the pattern highlighting
  }
  
  // Render with the highlighted indices
  return createHighlightedSpans(
    wordChars, 
    highlightIndices, 
    'text-green-600 font-bold'
  );
};
