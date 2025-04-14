
import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";
import { processDigraphs } from "../digraphs";
import { generateAlphagram } from "../digraphs";
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';

export const findPatternMatches = async (
  pattern: string, 
  trie: Trie, 
  showLongerWords: boolean = false,
  maxDefaultLength: number = 8,
  targetLength: number | null = null
): Promise<string[]> => {
  console.log('Starting pattern search with:', { pattern, showLongerWords, targetLength });

  // Handle pattern with specified length (e.g., "?A?:5")
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
  
  // Split into pattern and rack parts if applicable
  const [patternPart, rackPart] = processedPattern.includes(',') ? 
    processedPattern.split(',') : [processedPattern, ''];
  
  console.log('Processing pattern search:', { patternPart, rackPart, showLongerWords, specifiedLength });
  
  // Translate pattern with hyphens to regex format
  const translatedPattern = translateHyphenPattern(patternPart);
  console.log('Translated pattern:', translatedPattern);
  
  try {
    let matches: string[] = [];
    
    const processedPatternWithDigraphs = processDigraphs(translatedPattern);
    
    if (rackPart && rackPart.trim().length > 0) {
      console.log('Using rack letters for pattern matching:', rackPart.trim());
      
      // Identify pattern type
      const patternEndsWithHyphen = patternPart.endsWith('-');
      const patternStartsWithHyphen = patternPart.startsWith('-');
      const isContainsPattern = patternStartsWithHyphen && patternEndsWithHyphen;
      
      // Use the simplified alphagram approach
      matches = await findPatternMatchesWithRackAlphagram(
        processedPatternWithDigraphs,
        rackPart.trim(),
        trie,
        patternPart,
        isContainsPattern,
        patternStartsWithHyphen,
        patternEndsWithHyphen
      );
    } else {
      // For patterns without rack letters, use regex search
      const finalPattern = processedPatternWithDigraphs.replace(/\?/g, '.');
      const regexPattern = convertPatternToRegex(finalPattern);
      console.log('Searching trie with regex:', regexPattern.toString());
      matches = await searchTrie(trie.getRoot(), regexPattern);
    }
    
    console.log(`Found ${matches.length} matches before filtering by length`);
    
    // Filter by specified length if provided
    if (specifiedLength !== null) {
      return matches.filter(word => word.length === specifiedLength);
    }
    
    // Filter by length based on showLongerWords flag
    if (showLongerWords) {
      return matches.filter(word => word.length > maxDefaultLength);
    } else {
      return matches.filter(word => word.length <= maxDefaultLength);
    }
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return [];
  }
};

/**
 * Simplified approach using alphagrams to find pattern matches with rack letters
 */
const findPatternMatchesWithRackAlphagram = async (
  pattern: string,
  rackLetters: string,
  trie: Trie,
  originalPattern: string,
  isContainsPattern: boolean = false,
  isStartPattern: boolean = false,
  isEndPattern: boolean = false
): Promise<string[]> => {
  console.log('Using alphagram approach for pattern', pattern, 'with rack', rackLetters);
  
  // Process rack letters (handling wildcards)
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  // Extract fixed letters from pattern and their positions
  const fixedPositions = new Map<number, string>();
  const unfixedPositions = new Set<number>();
  let patternWithoutSpecialChars = pattern;
  
  // Remove regex special characters for processing
  if (pattern.startsWith('^')) {
    patternWithoutSpecialChars = patternWithoutSpecialChars.slice(1);
  }
  if (pattern.endsWith('$')) {
    patternWithoutSpecialChars = patternWithoutSpecialChars.slice(0, -1);
  }
  patternWithoutSpecialChars = patternWithoutSpecialChars.replace(/\.\*/g, '');
  
  // For contains pattern, we'll need a different approach
  if (isContainsPattern) {
    return findContainsPatternMatches(patternWithoutSpecialChars, processedRack, trie);
  }
  
  // Identify fixed and variable positions in the pattern
  for (let i = 0; i < patternWithoutSpecialChars.length; i++) {
    const char = patternWithoutSpecialChars[i];
    if (char === '.' || char === '?') {
      unfixedPositions.add(i);
    } else {
      fixedPositions.set(i, char);
    }
  }
  
  console.log('Fixed positions:', Object.fromEntries(fixedPositions.entries()));
  console.log('Unfixed positions:', Array.from(unfixedPositions));
  
  // Count wildcards in rack
  let wildcardCount = 0;
  const rackLetterMap = new Map<string, number>();
  
  for (const char of processedRack) {
    if (char === '*') {
      wildcardCount++;
    } else {
      rackLetterMap.set(char, (rackLetterMap.get(char) || 0) + 1);
    }
  }
  
  // Combine rack letters with fixed pattern letters
  const combinedLetters = new Map<string, number>(rackLetterMap);
  
  // Add fixed letters from pattern to combined letters
  for (const [_, letter] of fixedPositions) {
    combinedLetters.set(letter, (combinedLetters.get(letter) || 0) + 1);
  }
  
  // Calculate maximum possible word length based on available letters
  const maxPossibleLength = processedRack.length + (isStartPattern || isEndPattern ? patternWithoutSpecialChars.length : 0);
  
  // Generate alphagram from combined letters
  let alphagramBase = '';
  for (const [letter, count] of combinedLetters.entries()) {
    alphagramBase += letter.repeat(count);
  }
  
  const baseAlphagram = generateAlphagram(alphagramBase);
  console.log('Base alphagram for search:', baseAlphagram);
  
  // Get all possible words from trie
  const allWordCandidates = trie.getAllWords();
  console.log(`Checking ${allWordCandidates.length} words against pattern and rack`);
  
  const validMatches: string[] = [];
  
  // Check each word for pattern matching and letter availability
  for (const word of allWordCandidates) {
    // Skip words that are definitely too long
    if (wildcardCount === 0 && word.length > maxPossibleLength) {
      continue;
    }
    
    const processedWord = processDigraphs(word);
    
    // Skip words of incorrect length for exact patterns
    if (!isStartPattern && !isEndPattern && 
        processedWord.length !== patternWithoutSpecialChars.length) {
      continue;
    }
    
    // For start patterns, check prefix
    if (isStartPattern && !isEndPattern) {
      if (!checkStartPattern(processedWord, patternWithoutSpecialChars, fixedPositions)) {
        continue;
      }
    }
    
    // For end patterns, check suffix
    if (isEndPattern && !isStartPattern) {
      if (!checkEndPattern(processedWord, patternWithoutSpecialChars, fixedPositions)) {
        continue;
      }
    }
    
    // Check fixed positions
    let patternMatched = true;
    
    for (const [pos, letter] of fixedPositions.entries()) {
      if (pos >= processedWord.length || processedWord[pos] !== letter) {
        patternMatched = false;
        break;
      }
    }
    
    if (!patternMatched) {
      continue;
    }
    
    // Check if word can be formed with available letters
    if (canFormWordWithRack(processedWord, processedRack, wildcardCount, fixedPositions)) {
      validMatches.push(word);
    }
  }
  
  console.log(`Found ${validMatches.length} valid matches using alphagram approach`);
  return validMatches;
};

// Check if a word starts with a pattern considering fixed positions
const checkStartPattern = (
  word: string, 
  pattern: string, 
  fixedPositions: Map<number, string>
): boolean => {
  if (word.length < pattern.length) {
    return false;
  }
  
  for (const [pos, letter] of fixedPositions.entries()) {
    if (pos >= word.length || word[pos] !== letter) {
      return false;
    }
  }
  
  return true;
};

// Check if a word ends with a pattern considering fixed positions
const checkEndPattern = (
  word: string, 
  pattern: string, 
  fixedPositions: Map<number, string>
): boolean => {
  if (word.length < pattern.length) {
    return false;
  }
  
  const offset = word.length - pattern.length;
  
  for (const [pos, letter] of fixedPositions.entries()) {
    const wordPos = pos + offset;
    if (wordPos >= word.length || word[wordPos] !== letter) {
      return false;
    }
  }
  
  return true;
};

// Find words that contain a pattern anywhere
const findContainsPatternMatches = (
  pattern: string,
  rackLetters: string,
  trie: Trie
): string[] => {
  console.log('Finding words containing pattern:', pattern);
  
  // Process pattern for digraphs
  const processedPattern = processDigraphs(pattern);
  
  // Get all words from trie
  const allWords = trie.getAllWords();
  
  // Extract wildcard count from rack
  let wildcardCount = 0;
  for (const char of rackLetters) {
    if (char === '*') {
      wildcardCount++;
    }
  }
  
  // Find words containing the pattern
  const matches: string[] = [];
  
  for (const word of allWords) {
    const processedWord = processDigraphs(word);
    
    // Check if word contains pattern
    if (processedWord.includes(processedPattern)) {
      // Check if word can be formed with rack letters
      if (canFormWordWithRack(processedWord, rackLetters, wildcardCount, new Map())) {
        matches.push(word);
      }
    }
  }
  
  return matches;
};

// Check if a word can be formed with available rack letters plus fixed pattern positions
const canFormWordWithRack = (
  word: string,
  rackLetters: string,
  wildcardCount: number,
  fixedPositions: Map<number, string>
): boolean => {
  // Create a copy of the rack letter counts
  const availableLetters = new Map<string, number>();
  const processedRack = processDigraphs(rackLetters);
  
  for (const char of processedRack) {
    if (char !== '*') {
      availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
    }
  }
  
  // Track letter usage in the word
  const usedLetters = new Map<string, number>();
  
  // First, count letters at fixed positions (these don't count against rack)
  const fixedLetters = new Set<number>();
  for (const [pos, _] of fixedPositions.entries()) {
    if (pos < word.length) {
      fixedLetters.add(pos);
    }
  }
  
  // Count letters that need to come from rack
  for (let i = 0; i < word.length; i++) {
    // Skip letters at fixed positions as they don't count against rack
    if (fixedLetters.has(i)) {
      continue;
    }
    
    const char = word[i];
    usedLetters.set(char, (usedLetters.get(char) || 0) + 1);
  }
  
  // Check if we have enough letters including wildcards
  let remainingWildcards = wildcardCount;
  
  for (const [letter, count] of usedLetters.entries()) {
    const available = availableLetters.get(letter) || 0;
    
    if (available >= count) {
      // We have enough of this letter
      availableLetters.set(letter, available - count);
    } else {
      // We need wildcards to cover the deficit
      const deficit = count - available;
      
      if (remainingWildcards >= deficit) {
        // Use wildcards
        remainingWildcards -= deficit;
        // Set available to 0 for this letter
        if (available > 0) {
          availableLetters.set(letter, 0);
        }
      } else {
        // Not enough wildcards to cover deficit
        return false;
      }
    }
  }
  
  return true;
};
