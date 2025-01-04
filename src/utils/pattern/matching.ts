import { Trie } from "../trie";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";

export const findPatternMatches = async (pattern: string, trie: Trie): Promise<string[]> => {
  // Split pattern and rack if comma exists
  const [patternPart, rackPart] = pattern.includes(',') ? pattern.split(',') : [pattern, ''];
  
  // Convert hyphens to wildcards for any position
  const processedPattern = patternPart
    .replace(/\-/g, '?') // Convert hyphens to question marks (single character wildcards)
    .replace(/\?\?+/g, '?'); // Collapse multiple consecutive wildcards
  
  // Create regex pattern
  const regexPattern = convertPatternToRegex(processedPattern);
  
  try {
    // Get all words from trie that match the pattern
    // Pass the root node of the trie instead of the trie instance
    const matches = await searchTrie(trie.getRoot(), regexPattern, rackPart);
    return matches;
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return [];
  }
};