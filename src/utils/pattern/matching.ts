import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";

export const findPatternMatches = async (pattern: string, trie: Trie): Promise<string[]> => {
  // Split pattern and rack if comma exists
  const [patternPart, rackPart] = pattern.includes(',') ? pattern.split(',') : [pattern, ''];
  
  console.log('Pattern before processing:', patternPart);
  
  // Convert hyphens to anchors
  let processedPattern = patternPart;
  if (processedPattern.startsWith('-')) {
    processedPattern = processedPattern.slice(1) + '$';
  } else if (processedPattern.endsWith('-')) {
    processedPattern = '^' + processedPattern.slice(0, -1);
  }
  
  console.log('Pattern after processing:', processedPattern);
  
  // Create regex pattern
  const regexPattern = convertPatternToRegex(processedPattern);
  console.log('Regex pattern:', regexPattern);
  
  try {
    // Get all words from trie that match the pattern
    const matches = await searchTrie(trie.getRoot(), regexPattern, rackPart);
    console.log('Found matches:', matches);
    return matches;
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return [];
  }
};