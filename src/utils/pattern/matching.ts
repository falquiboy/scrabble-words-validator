
import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";

export const findPatternMatches = async (
  pattern: string, 
  trie: Trie, 
  showLongerWords: boolean = false,
  maxDefaultLength: number = 8
): Promise<string[]> => {
  // Split pattern and rack if comma exists
  const [patternPart, rackPart] = pattern.includes(',') ? pattern.split(',') : [pattern, ''];
  
  // First translate any hyphen-based patterns like -CON to proper pattern format
  const translatedPattern = translateHyphenPattern(patternPart);
  
  // Then convert to regex pattern (handle wildcards)
  // Don't convert hyphens to wildcards - they've already been processed by translateHyphenPattern
  const processedPattern = translatedPattern
    .replace(/\?/g, '.'); // Convert question marks to single character wildcards
  
  // Create regex pattern
  const regexPattern = convertPatternToRegex(processedPattern);
  
  try {
    // Get all words from trie that match the pattern
    const allMatches = await searchTrie(trie.getRoot(), regexPattern, rackPart);
    
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
