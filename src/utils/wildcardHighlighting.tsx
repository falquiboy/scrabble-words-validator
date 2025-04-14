
import React from 'react';
import { processDigraphs } from './digraphs';
import { translateHyphenPattern } from './pattern/translation';

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
  return (
    <span className="inline-flex">
      {word.split('').map((char, index) => {
        // Find if this position is part of a digraph
        const digraph = digraphPositions.find(pos => pos?.start === index || pos?.end === index);
        
        // Check if this character or digraph is unmatched
        const isUnmatched = !matchedIndices.has(index);
        
        // Handle digraphs
        if (digraph) {
          if (index === digraph.start) {
            // Only render the digraph at its start position
            return isUnmatched ? (
              <span key={index} className="text-red-600 font-semibold lowercase">
                {char}{word[index + 1]}
              </span>
            ) : (
              <span key={index} className="font-semibold">
                {char}{word[index + 1]}
              </span>
            );
          } else if (index === digraph.end) {
            // Skip the second character of the digraph
            return null;
          }
        }
        
        // Handle regular characters
        return isUnmatched ? (
          <span key={index} className="text-red-600 font-semibold lowercase">
            {char}
          </span>
        ) : (
          <span key={index} className="font-semibold">
            {char}
          </span>
        );
      })}
    </span>
  );
};

/**
 * Highlight pattern matches with rack letters
 * For patterns like "-NAS,AOL*", highlight the rack letters used to complete the pattern
 */
export const highlightPatternMatch = (word: string, pattern: string, rackLetters: string): React.ReactNode => {
  if (!word || !pattern) return word;
  
  // Process the pattern to handle hyphen notation
  const translatedPattern = translateHyphenPattern(pattern);

  // Process the pattern to handle digraphs
  const processedPattern = processDigraphs(translatedPattern);

  // Determine pattern type (starts with, ends with, contains)
  const isStartPattern = processedPattern.startsWith('^') || pattern.endsWith('-');
  const isEndPattern = processedPattern.endsWith('$') || pattern.startsWith('-');
  const isContainsPattern = pattern.startsWith('-') && pattern.endsWith('-');
  
  // Extract the fixed part of the pattern
  let fixedPattern = processedPattern
    .replace(/^\^|\$$/g, '')  // Remove start/end anchors
    .replace(/\.\*/g, '')     // Remove .* wildcards
    .replace(/\.\+/g, '')     // Remove .+ wildcards
    .replace(/\./g, '');      // Remove . wildcards

  // Handle question marks in pattern
  let questionMarkPositions: number[] = [];
  if (pattern.includes('?')) {
    // Find positions of question marks in the original pattern
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '?') {
        questionMarkPositions.push(i);
      }
    }
    // Remove question marks from fixed pattern
    fixedPattern = fixedPattern.replace(/\?/g, '');
  }
  
  // Process rack letters
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  const hasWildcard = processedRack.includes('*');
  
  // Process the word for digraphs to correctly identify pattern matches
  const processedWord = processDigraphs(word);
  
  // Find positions of fixed pattern in the processed word
  let fixedStart = -1;
  let fixedEnd = -1;
  
  if (isStartPattern && !isContainsPattern) {
    fixedStart = 0;
    fixedEnd = fixedPattern.length - 1;
  } else if (isEndPattern && !isContainsPattern) {
    fixedStart = processedWord.length - fixedPattern.length;
    fixedEnd = processedWord.length - 1;
  } else if (isContainsPattern || (!isStartPattern && !isEndPattern && fixedPattern)) {
    // For contains patterns or regular substring patterns
    fixedStart = processedWord.indexOf(fixedPattern);
    fixedEnd = fixedStart + fixedPattern.length - 1;
  }
  
  // Create a map of positions that are part of the fixed pattern
  const fixedPositions = new Set<number>();
  if (fixedStart >= 0 && fixedEnd >= 0) {
    for (let i = fixedStart; i <= fixedEnd; i++) {
      fixedPositions.add(i);
    }
  }
  
  // Find digraph positions in the original word
  const digraphPositions = findDigraphPositions(word);
  
  // Return the word with highlighted characters
  return (
    <span className="inline-flex">
      {word.split('').map((char, index) => {
        // Skip if this index is part of an already processed digraph
        if (digraphPositions.some(pos => pos.end === index)) {
          return null;
        }

        // Check if this position is the start of a digraph
        const isDiGraphStart = digraphPositions.some(pos => pos.start === index);
        
        // Get the actual character or digraph to display
        const displayText = isDiGraphStart ? 
          `${char}${word[index + 1]}` : char;
        
        // Calculate corresponding position in the processed word
        // This is crucial for matching pattern positions correctly
        const processedIndex = processDigraphs(word.substring(0, index + 1)).length - 1;
        
        // Check if this character is part of the fixed pattern
        const isFixedPattern = fixedPositions.has(processedIndex);
        
        // Handle question mark positions if any
        const isQuestionMarkPosition = questionMarkPositions.some(pos => 
          processedIndex === pos || (fixedStart > 0 && processedIndex === fixedStart + pos)
        );
        
        // If it's a question mark position, highlight in blue
        if (isQuestionMarkPosition) {
          return (
            <span key={index} className="text-blue-600 font-semibold">
              {displayText}
            </span>
          );
        }
        
        // If it's part of the fixed pattern, display as uppercase
        if (isFixedPattern) {
          return <span key={index} className="font-semibold uppercase">{displayText}</span>;
        }
        
        // For -ZAS pattern, we need to highlight the characters before ZAS in blue
        // as they're completed using the rack letters
        if (isEndPattern && !isContainsPattern) {
          return (
            <span key={index} className="text-blue-600 font-semibold">
              {displayText}
            </span>
          );
        }
        
        // Check if it's likely a wildcard
        const isLikelyWildcard = hasWildcard && 
                               !processedRack.replace(/\*/g, '').includes(char.toUpperCase());
                               
        // If it's a likely wildcard, highlight in red and lowercase
        if (isLikelyWildcard) {
          return (
            <span key={index} className="text-red-600 font-semibold lowercase">
              {displayText}
            </span>
          );
        }
        
        // Regular rack letter (non-wildcard)
        return (
          <span key={index} className="text-blue-600 font-semibold">
            {displayText}
          </span>
        );
      })}
    </span>
  );
};
