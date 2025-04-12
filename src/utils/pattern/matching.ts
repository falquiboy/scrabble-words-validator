import { Trie } from "../trie/types";
import { searchTrie } from "../trie/search";
import { convertPatternToRegex } from "./conversion";
import { translateHyphenPattern } from "./translation";
import { processDigraphs } from "../digraphs";
import { generatePatternCombinations } from "./combinations";
import { SPANISH_LETTERS } from '@/hooks/anagramSearch/constants';

// Variable para almacenar los patrones base generados
const basePatches: string[] = [];

export const findPatternMatches = async (
  pattern: string, 
  trie: Trie, 
  showLongerWords: boolean = false,
  maxDefaultLength: number = 8,
  targetLength: number | null = null
): Promise<string[]> => {
  // Limpiar los patrones base de búsquedas anteriores
  basePatches.length = 0;

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
      // Modificado para manejar los patrones con cero o más caracteres al final
      const patternEndsWithHyphen = patternPart.endsWith('-');
      matches = await findPatternMatchesWithRack(
        processedPatternWithDigraphs, 
        rackPart.trim(), 
        trie, 
        patternEndsWithHyphen
      );
    } else {
      // For patterns without rack letters, we need to handle ? as a wildcard for any letter
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
  trie: Trie,
  extendPattern: boolean = false
): Promise<string[]> => {
  console.log('Generating combinations for pattern', pattern, 'with rack letters', rackLetters, 'extend:', extendPattern);
  
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
  
  // Si el patrón contiene comodines o se debe extender
  if (processedPattern.includes('?') || extendPattern) {
    return findWildcardPatternMatches(processedPattern, rackLetters, trie, extendPattern);
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
  trie: Trie,
  extendPattern: boolean = false
): Promise<string[]> => {
  console.log(`Buscando coincidencias para patrón con comodín: ${pattern}, extender: ${extendPattern}`);
  
  // Primero, buscar coincidencias exactas con el patrón base
  let allMatches: string[] = [];
  
  // Limpiamos la lista de patrones base antes de empezar
  basePatches.length = 0;
  
  // Para patrones con comodines, primero reemplazamos los ?
  const wildcardPositions: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '?') {
      wildcardPositions.push(i);
    }
  }
  
  const patternChars = pattern.split('');
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
  
  // Generar variaciones del patrón básico (reemplazando comodines)
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
  
  // Si necesitamos extender el patrón, buscar palabras que empiecen con las variaciones
  // y usar las letras restantes del rack para formar palabras más largas
  if (extendPattern && basePatches.length > 0) {
    console.log('Extendiendo el patrón para buscar palabras más largas con patrones base:', basePatches);
    const extendedMatches: string[] = [];
    
    // Por cada variación del patrón base, buscar extensiones
    for (const basePattern of basePatches) {
      const baseLetterUsed = countLettersUsed(basePattern, new Map());
      
      // Calcular letras disponibles después de usar el patrón base
      const remainingLetters = new Map<string, number>();
      let remainingWildcards = wildcards;
      
      for (const [letter, count] of availableLetters.entries()) {
        const used = baseLetterUsed.get(letter) || 0;
        if (count > used) {
          remainingLetters.set(letter, count - used);
        }
      }
      
      // Buscar palabras que comiencen con el patrón base
      const possibleExtensions = trie.getWordsStartingWith(basePattern);
      
      // Comprobar qué extensiones se pueden formar con las letras restantes
      for (const word of possibleExtensions) {
        if (word.length > basePattern.length) {
          const extension = word.slice(basePattern.length);
          if (canFormWithRack(extension, new Map(remainingLetters), remainingWildcards)) {
            extendedMatches.push(word);
          }
        }
      }
    }
    
    // Combinar las coincidencias exactas y extendidas
    allMatches = [...allMatches, ...extendedMatches];
  }
  
  return Array.from(new Set(allMatches));
};

const canFormWithRack = (
  word: string,
  availableLetters: Map<string, number>,
  wildcards: number
): boolean => {
  const wordLetters = new Map<string, number>();
  
  // Contar letras en la palabra
  for (const char of word) {
    wordLetters.set(char, (wordLetters.get(char) || 0) + 1);
  }
  
  // Verificar si tenemos suficientes letras
  for (const [letter, count] of wordLetters) {
    const available = availableLetters.get(letter) || 0;
    
    if (available < count) {
      // No tenemos suficientes de esta letra, 
      // veamos si podemos usar comodines
      const needed = count - available;
      if (wildcards >= needed) {
        wildcards -= needed;
      } else {
        return false;
      }
    } else {
      // Tenemos suficientes, descontamos
      availableLetters.set(letter, available - count);
    }
  }
  
  return true;
};

const countLettersUsed = (
  pattern: string,
  nonWildcardPositions: Map<number, string>
): Map<string, number> => {
  const usedLetters = new Map<string, number>();
  
  for (let i = 0; i < pattern.length; i++) {
    // Si esta posición tenía un comodín, no contamos 
    // (porque ya se descontó de las letras disponibles)
    if (!nonWildcardPositions.has(i)) {
      const char = pattern[i];
      usedLetters.set(char, (usedLetters.get(char) || 0) + 1);
    }
  }
  
  return usedLetters;
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
    basePatches.push(finalPattern);
    
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
  
  // For each wildcard position, try all letters from the rack
  if (rackLetters && rackLetters.trim().length > 0) {
    // Try all letters from the rack first (prioritize using rack letters)
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
    
    // Try using wildcards from the rack if available
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
  } else {
    // If no rack letters provided, try all possible letters
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
