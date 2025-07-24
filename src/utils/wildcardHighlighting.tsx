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
              <span key={index} className="text-red-600 font-semibold">
                {char.toUpperCase()}{word[index + 1].toUpperCase()}
              </span>
            ) : (
              <span key={index} className="font-semibold">
                {char.toUpperCase()}{word[index + 1].toUpperCase()}
              </span>
            );
          } else if (index === digraph.end) {
            // Skip the second character of the digraph
            return null;
          }
        }
        
        // Handle regular characters
        return isUnmatched ? (
          <span key={index} className="text-red-600 font-semibold">
            {char.toUpperCase()}
          </span>
        ) : (
          <span key={index} className="font-semibold">
            {char.toUpperCase()}
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

  // Determine pattern type (starts with, ends with, contains)
  const isStartPattern = translatedPattern.startsWith('^') || pattern.endsWith('-');
  const isEndPattern = translatedPattern.endsWith('$') || pattern.startsWith('-') && !pattern.endsWith('-');
  const isContainsPattern = pattern.startsWith('-') && pattern.endsWith('-');
  
  // Extract the fixed part of the pattern (without notation symbols)
  let fixedPattern = pattern;
  if (isEndPattern) {
    fixedPattern = pattern.replace(/^-/, '');
  } else if (isStartPattern) {
    fixedPattern = pattern.replace(/-$/, '');
  } else if (isContainsPattern) {
    fixedPattern = pattern.replace(/^-|-$/g, '');
  }
  
  // Remove any length filter (e.g., :6)
  fixedPattern = fixedPattern.replace(/:\d+$/, '');
  
  // Find positions of the fixed pattern in the word
  const fixedPatternPos = word.indexOf(fixedPattern);
  
  // Find digraph positions in the original word
  const digraphPositions = findDigraphPositions(word);
  
  // Used to track positions we've processed to avoid duplicates with digraphs
  const processedIndices = new Set<number>();
  
  return (
    <span className="inline-flex">
      {word.split('').map((char, index) => {
        // Skip if this index is part of an already processed digraph
        if (processedIndices.has(index)) return null;

        // Find if this position is part of a digraph
        const isDiGraphStart = digraphPositions.some(pos => pos.start === index);
        const digraph = digraphPositions.find(pos => pos.start === index);

        // Get the actual character or digraph to display
        const displayText = isDiGraphStart ? 
          `${char}${word[index + 1]}` : char;

        // If this is a digraph, mark both positions as processed
        if (isDiGraphStart && digraph) {
          processedIndices.add(digraph.end);
        }
        
        // For end patterns like -ZAS, ALL characters before the pattern should be blue
        if (isEndPattern && fixedPatternPos > 0 && index < fixedPatternPos) {
          return (
            <span key={index} className="text-blue-600 font-semibold">
              {displayText.toUpperCase()}
            </span>
          );
        }
        
        // For end patterns, the fixed pattern itself should be normal (not highlighted)
        if (isEndPattern && fixedPatternPos >= 0 && 
            index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
          return (
            <span key={index} className="font-semibold">
              {displayText.toUpperCase()}
            </span>
          );
        }

        // For start patterns like CO-, ALL characters after the pattern should be blue
        if (isStartPattern && fixedPatternPos >= 0 && 
            index >= fixedPatternPos + fixedPattern.length) {
          return (
            <span key={index} className="text-blue-600 font-semibold">
              {displayText.toUpperCase()}
            </span>
          );
        }
        
        // For start patterns, the fixed pattern itself should be normal (not highlighted)
        if (isStartPattern && fixedPatternPos >= 0 && 
            index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
          return (
            <span key={index} className="font-semibold">
              {displayText.toUpperCase()}
            </span>
          );
        }

        // For contains patterns, highlight everything except the pattern
        if (isContainsPattern && fixedPatternPos >= 0) {
          // If within the fixed pattern, display as normal
          if (index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
            return (
              <span key={index} className="font-semibold">
                {displayText.toUpperCase()}
              </span>
            );
          }
          
          // If outside the fixed pattern, highlight in blue
          return (
            <span key={index} className="text-blue-600 font-semibold">
              {displayText.toUpperCase()}
            </span>
          );
        }

        // For cases not covered by the specific patterns above, 
        // check if they might be from wildcards
        const isLikelyWildcard = rackLetters && 
                               rackLetters.includes('?') && 
                               !rackLetters.replace(/\?/g, '').toUpperCase().includes(char.toUpperCase());
                               
        // If it's a likely wildcard, highlight in red and lowercase
        if (isLikelyWildcard) {
          return (
            <span key={index} className="text-red-600 font-semibold">
              {displayText.toUpperCase()}
            </span>
          );
        }

        // Regular rack letter (non-wildcard) - highlight in blue
        return (
          <span key={index} className="text-blue-600 font-semibold">
            {displayText.toUpperCase()}
          </span>
        );
      })}
    </span>
  );
};
