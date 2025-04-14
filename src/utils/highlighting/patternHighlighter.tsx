
import React from 'react';
import { findDigraphPositions } from './digraphUtils';
import { PatternTypeInfo } from './patternTypes';

/**
 * Highlights pattern matches based on pattern type
 */
export const highlightBasedOnPatternType = (
  word: string, 
  fixedPattern: string, 
  fixedPatternPos: number,
  patternType: PatternTypeInfo,
  digraphPositions: { start: number, end: number }[],
  processedIndices: Set<number>,
  isLikelyWildcard: (char: string) => boolean
): React.ReactNode => {
  return word.split('').map((char, index) => {
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
    
    // For end patterns like -ZAS, ALL characters before the pattern should be highlighted
    if (patternType.isEndPattern && fixedPatternPos > 0 && index < fixedPatternPos) {
      return (
        <span key={index} className="text-blue-600">
          {displayText}
        </span>
      );
    }
    
    // For end patterns, the fixed pattern itself should be normal (not highlighted)
    if (patternType.isEndPattern && fixedPatternPos >= 0 && 
        index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
      return (
        <span key={index}>
          {char === 'I' ? <span className="font-mono">{char}</span> : displayText}
        </span>
      );
    }

    // For start patterns like CO-, ALL characters after the pattern should be highlighted
    if (patternType.isStartPattern && fixedPatternPos >= 0 && 
        index >= fixedPatternPos + fixedPattern.length) {
      return (
        <span key={index} className="text-blue-600">
          {displayText}
        </span>
      );
    }
    
    // For start patterns, the fixed pattern itself should be normal (not highlighted)
    if (patternType.isStartPattern && fixedPatternPos >= 0 && 
        index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
      return (
        <span key={index}>
          {char === 'I' ? <span className="font-mono">{char}</span> : displayText}
        </span>
      );
    }

    // For contains patterns, highlight everything except the pattern
    if (patternType.isContainsPattern && fixedPatternPos >= 0) {
      // If within the fixed pattern, display as normal
      if (index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
        return (
          <span key={index}>
            {char === 'I' ? <span className="font-mono">{char}</span> : displayText}
          </span>
        );
      }
      
      // If outside the fixed pattern, highlight in blue
      return (
        <span key={index} className="text-blue-600">
          {displayText}
        </span>
      );
    }

    // Special handling for patterns with question marks like ?L-
    if (fixedPattern.includes('?') && fixedPattern.length > 1) {
      const questionIndex = fixedPattern.indexOf('?');
      
      // If there's a character after the question mark (like 'L' in '?L')
      if (questionIndex < fixedPattern.length - 1) {
        const fixedChar = fixedPattern.charAt(questionIndex + 1);
        
        // If current character matches the fixed character after '?'
        // ONLY this exact position should be normal, not highlighted
        if (fixedPatternPos >= 0 && 
            index === fixedPatternPos + questionIndex + 1 &&
            char.toUpperCase() === fixedChar.toUpperCase()) {
          return (
            <span key={index}>
              {char === 'I' ? <span className="font-mono">{char}</span> : displayText}
            </span>
          );
        }
        
        // All other characters in the matched word should be highlighted in blue
        // regardless of whether they're part of the pattern or not
        return (
          <span key={index} className="text-blue-600">
            {char === 'I' ? <span className="font-mono text-blue-600">{char}</span> : displayText}
          </span>
        );
      }
    }

    // For cases not covered by the specific patterns above
    // If it's a likely wildcard, use red color and lowercase, but no bold
    if (isLikelyWildcard(char)) {
      return (
        <span key={index} className="text-red-600 lowercase">
          {displayText}
        </span>
      );
    }

    // Regular rack letter (non-wildcard) - highlight in blue without bold
    return (
      <span key={index} className="text-blue-600">
        {char === 'I' ? <span className="font-mono text-blue-600">{char}</span> : displayText}
      </span>
    );
  });
};
