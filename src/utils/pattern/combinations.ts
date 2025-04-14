
import { processDigraphs } from "../digraphs";

export const generatePatternCombinations = (
  pattern: string,
  rackLetters: string,
  isStartPattern: boolean = false,
  isEndPattern: boolean = false,
  isContainsPattern: boolean = false
): string[] => {
  // If pattern is empty, return an empty array
  if (!pattern.trim()) {
    return [];
  }

  const processedPattern = processDigraphs(pattern);
  const processedRack = processDigraphs(rackLetters);

  // Handle the contains pattern case
  if (isContainsPattern) {
    return [processedPattern];
  }

  // For exact patterns without modifiers
  if (!isStartPattern && !isEndPattern) {
    return [processedPattern];
  }

  // Start pattern: generate all words starting with the pattern
  if (isStartPattern && !isEndPattern) {
    return [processedPattern];
  }

  // End pattern: generate all words ending with the pattern
  if (isEndPattern && !isStartPattern) {
    return [processedPattern];
  }

  // Both start and end pattern (should be rare)
  return [processedPattern];
};
