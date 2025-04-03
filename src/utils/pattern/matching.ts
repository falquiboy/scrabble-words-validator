
import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";

export const findPatternMatches = async (
  pattern: string, 
  trie: Trie, 
  showLongerWords: boolean = false,
  maxDefaultLength: number = 8,
  targetLength: number | null = null
): Promise<string[]> => {
  // Process pattern to extract length if specified (pattern/length format)
  const patternParts = pattern.split('/');
  let processedPattern = pattern;
  let specifiedLength = targetLength;
  
  if (patternParts.length > 1) {
    processedPattern = patternParts[0];
    const lengthStr = patternParts[1];
    if (lengthStr && /^\d+$/.test(lengthStr)) {
      specifiedLength = parseInt(lengthStr, 10);
    }
  }
  
  // Split pattern and rack if comma exists
  const [patternPart, rackPart] = processedPattern.includes(',') ? 
    processedPattern.split(',') : [processedPattern, ''];
  
  // First translate any hyphen-based patterns like -CON to proper pattern format
  const translatedPattern = translateHyphenPattern(patternPart);
  
  // Then convert to regex pattern (handle wildcards)
  // Don't convert hyphens to wildcards - they've already been processed by translateHyphenPattern
  const finalPattern = translatedPattern
    .replace(/\?/g, '.'); // Convert question marks to single character wildcards
  
  // Create regex pattern
  const regexPattern = convertPatternToRegex(finalPattern);
  
  try {
    // Get all words from trie that match the pattern
    const allMatches = await searchTrie(trie.getRoot(), regexPattern, rackPart);
    
    // If target length is specified, filter by exact length
    if (specifiedLength !== null) {
      return allMatches.filter(word => word.length === specifiedLength);
    }
    
    // Filter results based on the length preference
    if (showLongerWords) {
      // When toggle is ON for pattern search, show words LONGER than maxDefaultLength
      return allMatches.filter(word => word.length > maxDefaultLength);
    } else {
      // When toggle is OFF, show only words up to maxDefaultLength
      return allMatches.filter(word => word.length <= maxDefaultLength);
    }
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return [];
  }
};
