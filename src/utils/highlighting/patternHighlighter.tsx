
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
    
    // For end patterns like -ZAS, ALL characters before the pattern should be blue
    if (patternType.isEndPattern && fixedPatternPos > 0 && index < fixedPatternPos) {
      return (
        <span key={index} className="text-blue-600 font-semibold">
          {displayText}
        </span>
      );
    }
    
    // For end patterns, the fixed pattern itself should be normal (not highlighted)
    if (patternType.isEndPattern && fixedPatternPos >= 0 && 
        index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
      return (
        <span key={index} className="font-semibold">
          {displayText}
        </span>
      );
    }

    // For start patterns like CO-, ALL characters after the pattern should be blue
    if (patternType.isStartPattern && fixedPatternPos >= 0 && 
        index >= fixedPatternPos + fixedPattern.length) {
      return (
        <span key={index} className="text-blue-600 font-semibold">
          {displayText}
        </span>
      );
    }
    
    // For start patterns, the fixed pattern itself should be normal (not highlighted)
    if (patternType.isStartPattern && fixedPatternPos >= 0 && 
        index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
      return (
        <span key={index} className="font-semibold">
          {displayText}
        </span>
      );
    }

    // For contains patterns, highlight everything except the pattern
    if (patternType.isContainsPattern && fixedPatternPos >= 0) {
      // If within the fixed pattern, display as normal
      if (index >= fixedPatternPos && index < fixedPatternPos + fixedPattern.length) {
        return (
          <span key={index} className="font-semibold">
            {displayText}
          </span>
        );
      }
      
      // If outside the fixed pattern, highlight in blue
      return (
        <span key={index} className="text-blue-600 font-semibold">
          {displayText}
        </span>
      );
    }

    // For cases not covered by the specific patterns above
    // If it's a likely wildcard, highlight in red and lowercase
    if (isLikelyWildcard(char)) {
      return (
        <span key={index} className="text-red-600 font-semibold lowercase">
          {displayText}
        </span>
      );
    }

    // Regular rack letter (non-wildcard) - highlight in blue
    return (
      <span key={index} className="text-blue-600 font-semibold">
        {displayText}
      </span>
    );
  });
};
