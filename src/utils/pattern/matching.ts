
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
  
  // First translate any hyphen-based patterns like -CON to proper pattern format
  const translatedPattern = translateHyphenPattern(patternPart);
  
  try {
    let matches: string[] = [];
    
    // Process digraphs in the pattern before searching
    // This is the key fix - convert digraphs to internal representation
    const processedPatternWithDigraphs = processDigraphs(translatedPattern);
    
    // If we have rack letters, use the combination generation approach
    if (rackPart && rackPart.trim().length > 0) {
      console.log('Using rack letters for pattern:', rackPart.trim());
      // Use the processed pattern with digraphs
      matches = await findPatternMatchesWithRack(processedPatternWithDigraphs, rackPart.trim(), trie);
    } else {
      // For simple pattern searches without rack letters, use the regex approach
      // Convert question marks to single character wildcards after processing digraphs
      const finalPattern = processedPatternWithDigraphs.replace(/\?/g, '.');
      const regexPattern = convertPatternToRegex(finalPattern);
      console.log('Searching trie with:', { pattern: regexPattern.toString(), rackLetters: '', hasRackLetters: '' });
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
  const containsMiddlePattern = pattern.includes('.+') && !startsWithPattern && !endsWithPattern;
  
  // Handle patterns with regex special characters for word generation
  if (endsWithPattern) {
    processedPattern = processedPattern.slice(0, -1);
  }
  if (startsWithPattern) {
    processedPattern = processedPattern.slice(1);
  }
  
  // Remove .* and .+ patterns (these come from translateHyphenPattern for patterns like -NAS)
  processedPattern = processedPattern.replace(/\.\*/g, '').replace(/\.\+/g, '');
  
  // Replace ? with actual letters for combination generation, not for searching
  if (processedPattern.includes('?')) {
    // Generar todas las combinaciones posibles reemplazando ? con letras reales
    return findWildcardPatternMatches(processedPattern, rackLetters, trie);
  }
  
  // Process the rack letters for digraphs (pattern was already processed)
  const formattedPattern = processedPattern;
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  // Determine pattern type (start, end, contains)
  const isStartPattern = startsWithPattern || pattern.includes('^');
  const isEndPattern = endsWithPattern || pattern.endsWith('$');
  
  // Generate all possible words that could be formed with the pattern and rack letters
  const possibleWords = generatePatternCombinations(
    formattedPattern, 
    processedRack, 
    isStartPattern, 
    isEndPattern
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

/**
 * Encuentra coincidencias para patrones con comodín ? reemplazándolo por todas las letras posibles
 */
const findWildcardPatternMatches = async (
  pattern: string,
  rackLetters: string,
  trie: Trie
): Promise<string[]> => {
  console.log(`Buscando coincidencias para patrón con comodín: ${pattern}`);
  
  // Posiciones de los comodines
  const wildcardPositions: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '?') {
      wildcardPositions.push(i);
    }
  }
  
  // Si no hay comodines, regresamos la búsqueda normal
  if (wildcardPositions.length === 0) {
    return findPatternMatchesWithRack(pattern, rackLetters, trie);
  }
  
  const patternChars = pattern.split('');
  const allMatches: string[] = [];
  
  // Procesamos el rack de letras disponibles
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  // Contamos las letras disponibles en el rack
  const availableLetters = new Map<string, number>();
  let wildcards = 0;
  
  for (const char of processedRack) {
    if (char === '*') {
      wildcards++;
    } else {
      availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
    }
  }
  
  // Generamos todas las variaciones posibles del patrón
  await generateAllPatternVariations(
    patternChars, 
    wildcardPositions, 
    0, 
    new Map(availableLetters), 
    wildcards, 
    trie, 
    allMatches
  );
  
  return Array.from(new Set(allMatches));
};

/**
 * Genera todas las variaciones posibles de un patrón con comodines
 */
const generateAllPatternVariations = async (
  patternChars: string[],
  wildcardPositions: number[],
  currentPosition: number,
  remainingLetters: Map<string, number>,
  remainingWildcards: number,
  trie: Trie,
  results: string[]
): Promise<void> => {
  // Si hemos procesado todos los comodines, verificamos el patrón resultante
  if (currentPosition >= wildcardPositions.length) {
    const finalPattern = patternChars.join('');
    
    // Determinamos si el patrón tiene características de inicio o fin específicas
    const isStartPattern = finalPattern.startsWith('^');
    const isEndPattern = finalPattern.endsWith('$');
    
    // Limpiamos el patrón para la generación de palabras
    let cleanPattern = finalPattern;
    if (isStartPattern) cleanPattern = cleanPattern.slice(1);
    if (isEndPattern) cleanPattern = cleanPattern.slice(0, -1);
    cleanPattern = cleanPattern.replace(/\.\*/g, '').replace(/\.\+/g, '');
    
    // Generamos las combinaciones y buscamos en el trie
    try {
      const possibleWords = generatePatternCombinations(
        cleanPattern,
        '',  // Ya usamos las letras del rack para reemplazar los comodines
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
  
  // Posición actual del comodín a reemplazar
  const wildcardPos = wildcardPositions[currentPosition];
  
  // Probar con letras disponibles del rack
  for (const [letter, count] of remainingLetters.entries()) {
    if (count > 0) {
      patternChars[wildcardPos] = letter;
      
      // Actualizamos las letras disponibles
      const newRemainingLetters = new Map(remainingLetters);
      newRemainingLetters.set(letter, count - 1);
      
      // Procesamos el siguiente comodín
      await generateAllPatternVariations(
        patternChars,
        wildcardPositions,
        currentPosition + 1,
        newRemainingLetters,
        remainingWildcards,
        trie,
        results
      );
    }
  }
  
  // Probar con comodines del rack (si hay disponibles)
  if (remainingWildcards > 0) {
    for (const letter of SPANISH_LETTERS) {
      patternChars[wildcardPos] = letter;
      
      // Procesamos el siguiente comodín
      await generateAllPatternVariations(
        patternChars,
        wildcardPositions,
        currentPosition + 1,
        new Map(remainingLetters),
        remainingWildcards - 1,
        trie,
        results
      );
    }
  }
  
  // Si no quedan letras ni comodines suficientes, probar directamente con letras del alfabeto
  // (solo para búsquedas sin rack o cuando queremos todas las posibilidades)
  if (rackLetters === '' || (remainingWildcards === 0 && !hasEnoughLetters(remainingLetters, wildcardPositions.length - currentPosition))) {
    for (const letter of SPANISH_LETTERS) {
      patternChars[wildcardPos] = letter;
      
      // Procesamos el siguiente comodín
      await generateAllPatternVariations(
        patternChars,
        wildcardPositions,
        currentPosition + 1,
        new Map(remainingLetters),
        remainingWildcards,
        trie,
        results
      );
    }
  }
  
  // Restauramos el comodín para la próxima iteración
  patternChars[wildcardPos] = '?';
};

/**
 * Verifica si hay suficientes letras disponibles para cubrir los comodines restantes
 */
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

