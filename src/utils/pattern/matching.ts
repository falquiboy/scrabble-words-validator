
import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";

export const findPatternMatches = async (pattern: string, trie: Trie): Promise<string[]> => {
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
    const matches = await searchTrie(trie.getRoot(), regexPattern, rackPart);
    return matches;
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return [];
  }
};
