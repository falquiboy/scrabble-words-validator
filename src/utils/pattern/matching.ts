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
  console.log('Starting pattern search with:', { pattern, showLongerWords, targetLength });

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
  console.log('Translated pattern:', translatedPattern);
  
  try {
    let matches: string[] = [];
    
    const processedPatternWithDigraphs = processDigraphs(translatedPattern);
    
    if (rackPart && rackPart.trim().length > 0) {
      console.log('Using rack letters for pattern:', rackPart.trim());
      // Identificar si el patrón debe extenderse
      const patternEndsWithHyphen = patternPart.endsWith('-');
      const patternStartsWithHyphen = patternPart.startsWith('-');
      
      // Para patrones tipo -R-, necesitamos asegurarnos de que se buscan coincidencias en cualquier parte
      const isContainsPattern = patternStartsWithHyphen && patternEndsWithHyphen;
      
      matches = await findPatternMatchesWithRack(
        processedPatternWithDigraphs, 
        rackPart.trim(), 
        trie, 
        patternEndsWithHyphen,
        patternStartsWithHyphen && !patternEndsWithHyphen,
        isContainsPattern
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
  extendPattern: boolean = false,
  prefixPattern: boolean = false,
  isContainsPattern: boolean = false
): Promise<string[]> => {
  console.log('Generating combinations for pattern', pattern, 'with rack letters', rackLetters, 'extend:', extendPattern, 'contains:', isContainsPattern);
  
  let processedPattern = pattern;
  const endsWithPattern = pattern.endsWith('$');
  const startsWithPattern = pattern.startsWith('^');
  const containsMiddlePattern = isContainsPattern || (pattern.includes('.*') && !startsWithPattern && !endsWithPattern);
  
  if (endsWithPattern) {
    processedPattern = processedPattern.slice(0, -1);
  }
  if (startsWithPattern) {
    processedPattern = processedPattern.slice(1);
  }
  
  processedPattern = processedPattern.replace(/\.\*/g, '').replace(/\.\+/g, '');
  
  // Si el patrón contiene comodines o se debe extender
  if (processedPattern.includes('?') || extendPattern || prefixPattern || isContainsPattern) {
    return findWildcardPatternMatches(processedPattern, rackLetters, trie, extendPattern, prefixPattern, isContainsPattern);
  }
  
  const formattedPattern = processedPattern;
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  const isStartPattern = startsWithPattern || pattern.includes('^');
  const isEndPattern = endsWithPattern || pattern.endsWith('$');
  
  const possibleWords = generatePatternCombinations(
    formattedPattern, 
    processedRack, 
    isStartPattern, 
    isEndPattern,
    isContainsPattern
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
  extendPattern: boolean = false,
  prefixPattern: boolean = false,
  isContainsPattern: boolean = false
): Promise<string[]> => {
  console.log(`Buscando coincidencias para patrón con comodín: ${pattern}, extender: ${extendPattern}, prefijo: ${prefixPattern}, contiene: ${isContainsPattern}`);
  
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
  
  console.log(`Rack letters available:`, Object.fromEntries(availableLetters.entries()), `Wildcards: ${wildcards}`);
  
  // Generar variaciones del patrón básico (reemplazando comodines)
  await generateAllPatternVariations(
    patternChars, 
    wildcardPositions, 
    0, 
    new Map(availableLetters), 
    wildcards, 
    trie, 
    allMatches,
    rackLetters,
    isContainsPattern,
    extendPattern,
    prefixPattern
  );
  
  // Si necesitamos extender el patrón o buscar en cualquier posición (contains),
  // buscar palabras que incluyan las variaciones básicas
  if ((extendPattern || prefixPattern || isContainsPattern) && basePatches.length > 0) {
    console.log('Extendiendo o buscando en cualquier posición con patrones base:', basePatches);
    const extendedMatches: string[] = [];
    
    // Palabras para optimizar la búsqueda
    const baseWords = trie.getAllWords();
    
    // Por cada variación del patrón base, buscar extensiones o inclusiones
    for (const basePattern of basePatches) {
      if (isContainsPattern) {
        // Buscar palabras que contengan el patrón en cualquier posición
        for (const word of baseWords) {
          // Verificar que la palabra contenga el patrón
          if (word.includes(basePattern)) {
            // Comprobar si podemos formar esta palabra con las fichas del rack
            if (canFormWordWithRack(word, rackLetters, basePattern)) {
              extendedMatches.push(word);
            }
          }
        }
      } else if (extendPattern) {
        // Buscar palabras que empiecen con el patrón base y se extiendan
        const baseLetterUsed = countLettersUsed(basePattern, new Map());
        
        // Calcular letras disponibles después de usar el patrón base
        const remainingLetters = new Map<string, number>();
        let remainingWildcards = wildcards;
        
        for (const [letter, count] of availableLetters.entries()) {
          const used = baseLetterUsed.get(letter) || 0;
          if (count > used) {
            remainingLetters.set(letter, count - used);
          } else {
            const deficit = used - count;
            if (remainingWildcards >= deficit) {
              remainingWildcards -= deficit;
            }
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
          } else if (word.length === basePattern.length) {
            // Incluir las coincidencias exactas también
            extendedMatches.push(word);
          }
        }
      } else if (prefixPattern) {
        // Buscar palabras que terminen con el patrón base y tengan prefijos
        const baseLetterUsed = countLettersUsed(basePattern, new Map());
        
        // Calcular letras disponibles después de usar el patrón base
        const remainingLetters = new Map<string, number>();
        let remainingWildcards = wildcards;
        
        for (const [letter, count] of availableLetters.entries()) {
          const used = baseLetterUsed.get(letter) || 0;
          if (count > used) {
            remainingLetters.set(letter, count - used);
          } else {
            const deficit = used - count;
            if (remainingWildcards >= deficit) {
              remainingWildcards -= deficit;
            }
          }
        }
        
        // Buscar palabras que terminen con el patrón base
        for (const word of baseWords) {
          if (word.endsWith(basePattern)) {
            if (word.length > basePattern.length) {
              const prefix = word.slice(0, word.length - basePattern.length);
              if (canFormWithRack(prefix, new Map(remainingLetters), remainingWildcards)) {
                extendedMatches.push(word);
              }
            } else if (word.length === basePattern.length) {
              // Incluir las coincidencias exactas también
              extendedMatches.push(word);
            }
          }
        }
      }
    }
    
    // Combinar las coincidencias exactas y extendidas
    allMatches = [...allMatches, ...extendedMatches];
  }
  
  // Filtrar las coincidencias para asegurarnos de que solo usamos las letras disponibles en el rack
  const validMatches = allMatches.filter(word => {
    // Verificar si la palabra solo usa letras disponibles en el rack
    return canFormWordWithRackExact(word, rackLetters);
  });
  
  return Array.from(new Set(validMatches));
};

// Nueva función: Verifica si podemos formar una palabra usando EXACTAMENTE las letras del rack
// (sin letras adicionales)
const canFormWordWithRackExact = (
  word: string,
  rackLetters: string
): boolean => {
  console.log(`Checking if '${word}' can be formed with rack '${rackLetters}'`);
  const wordLetters = new Map<string, number>();
  const availableLetters = new Map<string, number>();
  let wildcards = 0;
  
  const processedWord = processDigraphs(word.toUpperCase());
  const processedRack = processDigraphs(rackLetters.toUpperCase());
  
  // Contar letras en la palabra
  for (const char of processedWord) {
    wordLetters.set(char, (wordLetters.get(char) || 0) + 1);
  }
  
  // Contar letras disponibles en el rack
  for (const char of processedRack) {
    if (char === '*') {
      wildcards++;
    } else {
      availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
    }
  }
  
  console.log('Word letters:', Object.fromEntries(wordLetters));
  console.log('Available rack letters:', Object.fromEntries(availableLetters), `Wildcards: ${wildcards}`);
  
  // Verificar si tenemos suficientes letras para formar la palabra
  for (const [letter, count] of wordLetters.entries()) {
    const available = availableLetters.get(letter) || 0;
    
    if (available < count) {
      // No tenemos suficientes de esta letra, 
      // veamos si podemos usar comodines
      const needed = count - available;
      if (wildcards >= needed) {
        wildcards -= needed;
        if (available > 0) {
          availableLetters.set(letter, 0);
        }
      } else {
        console.log(`Cannot form word: not enough of letter ${letter}, need ${count}, have ${available}, wildcards: ${wildcards}`);
        return false;
      }
    } else {
      // Tenemos suficientes, descontamos
      availableLetters.set(letter, available - count);
    }
  }
  
  console.log('Can form word with rack');
  return true;
};

// Verifica si podemos formar una palabra completa con las letras del rack
// considerando que ya tenemos un patrón base incluido
const canFormWordWithRack = (
  word: string,
  rackLetters: string,
  basePattern: string
): boolean => {
  // Verificar si podemos formar la palabra completa con las letras disponibles
  return canFormWordWithRackExact(word, rackLetters);
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
        if (available > 0) {
          availableLetters.set(letter, 0);
        }
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
  rackLetters: string,
  isContainsPattern: boolean = false,
  extendPattern: boolean = false,
  prefixPattern: boolean = false
): Promise<void> => {
  if (currentPosition >= wildcardPositions.length) {
    const finalPattern = patternChars.join('');
    basePatches.push(finalPattern);
    
    // Improve debugging
    console.log(`Generated pattern variation: ${finalPattern}`);
    
    // Si estamos en modo "contiene", no necesitamos buscar coincidencias exactas aquí
    // Las buscaremos después con la función específica para patrones "contiene"
    if (!isContainsPattern && !extendPattern && !prefixPattern) {
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
            // Verificar que podemos formar cada palabra con las letras del rack
            const validWords = foundWords.filter(w => {
              const canForm = canFormWordWithRackExact(w, rackLetters);
              return canForm;
            });
            
            if (validWords.length > 0) {
              console.log(`Found ${validWords.length} valid words for pattern ${cleanPattern}`);
            }
            
            results.push(...validWords);
          }
        }
      } catch (error) {
        console.error('Error generando variaciones de patrón:', error);
      }
    }
    
    return;
  }
  
  const wildcardPos = wildcardPositions[currentPosition];
  
  // For each wildcard position, try all letters from the rack
  if (rackLetters && rackLetters.trim().length > 0) {
    // Track if we've used any letters from the rack to fill the wildcard
    let usedRackLetter = false;
    
    // Try all letters from the rack first (prioritize using rack letters)
    for (const [letter, count] of remainingLetters.entries()) {
      if (count > 0) {
        patternChars[wildcardPos] = letter;
        usedRackLetter = true;
        
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
          rackLetters,
          isContainsPattern,
          extendPattern,
          prefixPattern
        );
      }
    }
    
    // Try using wildcards from the rack if available
    if (remainingWildcards > 0) {
      for (const letter of SPANISH_LETTERS) {
        patternChars[wildcardPos] = letter;
        usedRackLetter = true;
        
        await generateAllPatternVariations(
          patternChars,
          wildcardPositions,
          currentPosition + 1,
          new Map(remainingLetters),
          remainingWildcards - 1,
          trie,
          results,
          rackLetters,
          isContainsPattern,
          extendPattern,
          prefixPattern
        );
      }
    }
    
    // If we haven't used any rack letter (neither regular nor wildcard),
    // we need to handle that edge case to prevent recursion from stopping
    if (!usedRackLetter) {
      // If we can't fill the wildcard, we shouldn't continue with this branch
      patternChars[wildcardPos] = '?'; // Restore the original wildcard
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
        rackLetters,
        isContainsPattern,
        extendPattern,
        prefixPattern
      );
    }
  }
  
  patternChars[wildcardPos] = '?';
};
