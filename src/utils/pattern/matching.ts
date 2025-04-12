import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";
import { processDigraphs } from "../digraphs";
import { generatePatternCombinations } from "./combinations";
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';

export const findPatternMatches = async (
  pattern: string, 
  trie: Trie, 
  showLongerWords: boolean = false,
  maxDefaultLength: number = 8,
  targetLength: number | null = null
): Promise<string[]> => {
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
  
  const [patternPart, rackPart] = processedPattern.includes(',') ? 
    processedPattern.split(',') : [processedPattern, ''];
  
  console.log('Processing pattern search:', { patternPart, rackPart, showLongerWords, specifiedLength });
  
  const translatedPattern = translateHyphenPattern(patternPart);
  
  try {
    let matches: string[] = [];
    
    const processedPatternWithDigraphs = processDigraphs(translatedPattern);
    
    if (rackPart && rackPart.trim().length > 0) {
      console.log('Using rack letters for pattern:', rackPart.trim());
      matches = await findPatternMatchesWithRack(processedPatternWithDigraphs, rackPart.trim(), trie);
    } else {
      const finalPattern = processedPatternWithDigraphs.replace(/\?/g, '.');
      const regexPattern = convertPatternToRegex(finalPattern);
      console.log('Searching trie with:', { pattern: regexPattern.toString(), rackLetters: '', hasRackLetters: '' });
      matches = await searchTrie(trie.getRoot(), regexPattern);
    }
    
    console.log(`Found ${matches.length} matches before filtering`);
    
    if (specifiedLength !== null) {
      return matches.filter(word => word.length === specifiedLength);
    }
    
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

const findPatternMatchesWithRack = async (
  pattern: string, 
  rackLetters: string,
  trie: Trie
): Promise<string[]> => {
  console.log('Generating combinations for pattern', pattern, 'with rack letters', rackLetters);
  
  let processedPattern = pattern;
  const endsWithPattern = pattern.endsWith('$');
  const startsWithPattern = pattern.startsWith('^');
  const containsMiddlePattern = pattern.includes('.+') && !startsWithPattern && !endsWithPattern;
  
  if (endsWithPattern) {
    processedPattern = processedPattern.slice(0, -1);
  }
  if (startsWithPattern) {
    processedPattern = processedPattern.slice(1);
  }
  
  processedPattern = processedPattern.replace(/\.\*/g, '').replace(/\.\+/g, '');
  
  if (processedPattern.includes('?')) {
    return findWildcardPatternMatches(processedPattern, rackLetters, trie);
  }
  
  const formattedPattern = processedPattern;
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  const isStartPattern = startsWithPattern || pattern.includes('^');
  const isEndPattern = endsWithPattern || pattern.endsWith('$');
  
  const possibleWords = generatePatternCombinations(
    formattedPattern, 
    processedRack, 
    isStartPattern, 
    isEndPattern
  );
  
  console.log(`Generated ${possibleWords.length} possible combinations to check`);
  
  const matches: string[] = [];
  for (const word of possibleWords) {
    if (trie.search(word)) {
      const foundWords = trie.getWordsStartingWith(word).filter(w => w.length === word.length);
      matches.push(...foundWords);
    }
  }
  
  return Array.from(new Set(matches));
};

const findWildcardPatternMatches = async (
  pattern: string,
  rackLetters: string,
  trie: Trie
): Promise<string[]> => {
  console.log(`Buscando coincidencias para patrón con comodín: ${pattern}`);
  
  const wildcardPositions: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '?') {
      wildcardPositions.push(i);
    }
  }
  
  if (wildcardPositions.length === 0) {
    return findPatternMatchesWithRack(pattern, rackLetters, trie);
  }
  
  const patternChars = pattern.split('');
  const allMatches: string[] = [];
  
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  const availableLetters = new Map<string, number>();
  let wildcards = 0;
  
  for (const char of processedRack) {
    if (char === '*') {
      wildcards++;
    } else {
      availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
    }
  }
  
  await generateAllPatternVariations(
    patternChars, 
    wildcardPositions, 
    0, 
    new Map(availableLetters), 
    wildcards, 
    trie, 
    allMatches,
    rackLetters
  );
  
  return Array.from(new Set(allMatches));
};

const generateAllPatternVariations = async (
  patternChars: string[],
  wildcardPositions: number[],
  currentPosition: number,
  remainingLetters: Map<string, number>,
  remainingWildcards: number,
  trie: Trie,
  results: string[],
  rackLetters: string
): Promise<void> => {
  if (currentPosition >= wildcardPositions.length) {
    const finalPattern = patternChars.join('');
    
    const isStartPattern = finalPattern.startsWith('^');
    const isEndPattern = finalPattern.endsWith('$');
    
    let cleanPattern = finalPattern;
    if (isStartPattern) cleanPattern = cleanPattern.slice(1);
    if (isEndPattern) cleanPattern = cleanPattern.slice(0, -1);
    cleanPattern = cleanPattern.replace(/\.\*/g, '').replace(/\.\+/g, '');
    
    try {
      const possibleWords = generatePatternCombinations(
        cleanPattern,
        '',
        isStartPattern,
        isEndPattern
      );
      
      for (const word of possibleWords) {
        if (trie.search(word)) {
          const foundWords = trie.getWordsStartingWith(word).filter(w => w.length === word.length);
          results.push(...foundWords);
        }
      }
    } catch (error) {
      console.error('Error generando variaciones de patrón:', error);
    }
    
    return;
  }
  
  const wildcardPos = wildcardPositions[currentPosition];
  
  for (const [letter, count] of remainingLetters.entries()) {
    if (count > 0) {
      patternChars[wildcardPos] = letter;
      
      const newRemainingLetters = new Map(remainingLetters);
      newRemainingLetters.set(letter, count - 1);
      
      await generateAllPatternVariations(
        patternChars,
        wildcardPositions,
        currentPosition + 1,
        newRemainingLetters,
        remainingWildcards,
        trie,
        results,
        rackLetters
      );
    }
  }
  
  if (remainingWildcards > 0) {
    for (const letter of SPANISH_LETTERS) {
      patternChars[wildcardPos] = letter;
      
      await generateAllPatternVariations(
        patternChars,
        wildcardPositions,
        currentPosition + 1,
        new Map(remainingLetters),
        remainingWildcards - 1,
        trie,
        results,
        rackLetters
      );
    }
  }
  
  if (rackLetters === '' || (remainingWildcards === 0 && !hasEnoughLetters(remainingLetters, wildcardPositions.length - currentPosition))) {
    for (const letter of SPANISH_LETTERS) {
      patternChars[wildcardPos] = letter;
      
      await generateAllPatternVariations(
        patternChars,
        wildcardPositions,
        currentPosition + 1,
        new Map(remainingLetters),
        remainingWildcards,
        trie,
        results,
        rackLetters
      );
    }
  }
  
  patternChars[wildcardPos] = '?';
};

const hasEnoughLetters = (
  availableLetters: Map<string, number>,
  remainingWildcards: number
): boolean => {
  let totalAvailable = 0;
  for (const count of availableLetters.values()) {
    totalAvailable += count;
  }
  return totalAvailable >= remainingWildcards;
};
