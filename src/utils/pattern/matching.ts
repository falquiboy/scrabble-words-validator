
import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";
import { processDigraphs, toDisplayFormat } from "../digraphs";
import { generatePatternCombinations } from "./combinations";
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';
import { MAX_RACK_LETTERS, MAX_WILDCARDS } from '@/utils/inputValidation';

export const findPatternMatches = async (
  pattern: string, 
  trie: Trie, 
  showLongerWords: boolean = false,
  maxDefaultLength: number = 8,
  targetLength: number | null = null
): Promise<string[]> => {
  // Process pattern to extract length if specified (pattern:length format)
  const patternParts = pattern.split(':');
  let processedPattern = pattern;
  let specifiedLength = targetLength;
  
  if (patternParts.length > 1) {
    processedPattern = patternParts[0];
    const lengthStr = patternParts[1];
    if (lengthStr && /^\d+$/.test(lengthStr)) {
      specifiedLength = parseInt(lengthStr, 10);
      console.log('Length extracted from pattern with colon:', specifiedLength);
    }
  }
  
  // Split pattern and rack if comma exists
  const [patternPart, rackPart] = processedPattern.includes(',') ? 
    processedPattern.split(',') : [processedPattern, ''];
  
  console.log('Processing pattern search:', { patternPart, rackPart, showLongerWords, specifiedLength });
  
  // Validate rack letters don't exceed maximum
  const processedRack = rackPart ? rackPart.slice(0, MAX_RACK_LETTERS) : '';
  
  // Count wildcards and ensure they don't exceed maximum
  const wildcardCount = (processedRack.match(/\*/g) || []).length;
  if (wildcardCount > MAX_WILDCARDS) {
    console.warn(`Too many wildcards: ${wildcardCount}. Maximum allowed is ${MAX_WILDCARDS}`);
  }
  
  // First translate any hyphen-based patterns like -CON to proper pattern format
  // Important: We need to process digraphs in the pattern BEFORE translation
  const processedPatternPart = processDigraphs(patternPart);
  const translatedPattern = translateHyphenPattern(processedPatternPart);
  console.log('Translated pattern:', translatedPattern);
  
  try {
    let matches: string[] = [];
    
    // If we have rack letters, use the combination generation approach
    if (processedRack && processedRack.trim().length > 0) {
      console.log('Using rack letters for pattern:', processedRack.trim());
      matches = await findPatternMatchesWithRack(translatedPattern, processedRack.trim(), trie);
    } else {
      // For simple pattern searches without rack letters, use the regex approach
      const finalPattern = translatedPattern.replace(/\?/g, '.'); // Convert question marks to single character wildcards
      console.log('Using regex pattern:', finalPattern);
      const regexPattern = convertPatternToRegex(finalPattern);
      matches = await searchTrie(trie.getRoot(), regexPattern);
    }
    
    console.log(`Found ${matches.length} matches before filtering`);
    
    // If target length is specified, filter by exact length
    if (specifiedLength !== null) {
      return matches.filter(word => word.length === specifiedLength);
    }
    
    // Filter results based on the length preference
    if (showLongerWords) {
      // When toggle is ON for pattern search, show words LONGER than maxDefaultLength
      return matches.filter(word => word.length > maxDefaultLength);
    } else {
      // When toggle is OFF, show only words up to maxDefaultLength
      return matches.filter(word => word.length <= maxDefaultLength);
    }
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return [];
  }
};

/**
 * Find matches for a pattern using rack letters by generating
 * all possible combinations first, then checking the trie
 */
const findPatternMatchesWithRack = async (
  pattern: string, 
  rackLetters: string,
  trie: Trie
): Promise<string[]> => {
  console.log('Generating combinations for pattern', pattern, 'with rack letters', rackLetters);
  
  // Preprocessing the pattern for special cases
  // For patterns like "-NAS", translateHyphenPattern converts it to ".*NAS$"
  // We need to handle the regex special characters by removing them for word generation
  let processedPattern = pattern;
  const endsWithPattern = pattern.endsWith('$');
  const startsWithPattern = pattern.startsWith('^');
  const containsMiddlePattern = pattern.includes('.*') && !startsWithPattern && !endsWithPattern;
  
  // Handle patterns with regex special characters for word generation
  if (endsWithPattern) {
    processedPattern = processedPattern.slice(0, -1);
  }
  if (startsWithPattern) {
    processedPattern = processedPattern.slice(1);
  }
  
  // Remove .* and .+ patterns (these come from translateHyphenPattern for patterns like -NAS)
  processedPattern = processedPattern.replace(/\.\*/g, '').replace(/\.\+/g, '');
  
  // Process the pattern and rack letters for digraphs
  const formattedPattern = processDigraphs(processedPattern.toUpperCase());
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  // Determine pattern type (start, end, contains)
  const isStartPattern = startsWithPattern || pattern.includes('^');
  const isEndPattern = endsWithPattern || pattern.endsWith('$');
  const isContainsPattern = pattern.includes('.*') && !isStartPattern && !isEndPattern;
  
  console.log('Pattern type:', { isStartPattern, isEndPattern, isContainsPattern });
  
  // Generate all possible words that could be formed with the pattern and rack letters
  const possibleWords = generatePatternCombinations(
    formattedPattern, 
    processedRack, 
    isStartPattern, 
    isEndPattern,
    isContainsPattern
  );
  
  console.log(`Generated ${possibleWords.length} possible combinations to check`);
  
  // Check each possible word in the trie
  const matches: string[] = [];
  for (const word of possibleWords) {
    if (trie.search(word)) {
      // If the word exists in the trie, add it to matches
      // We get the original word form from the trie
      const foundWords = trie.getWordsStartingWith(word).filter(w => w.length === word.length);
      matches.push(...foundWords);
    }
  }
  
  // Return unique matches
  return Array.from(new Set(matches));
};
