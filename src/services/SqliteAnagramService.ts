/**
 * SqliteAnagramService - Servicio de anagramas usando SQLite WASM
 * Reemplaza IndexedDbAnagramService con poder SQL superior
 * 
 * ¡Bendecido con transacciones rápidas y queries poderosas! 🙏⚡
 */

import { SQLiteWordDatabase, sqliteDB, WordEntry } from './SQLiteWordDatabase';
import { filterByQueryConstraints, parseUserQuery } from '../utils/queryLanguage.mjs';
import {
  getWildcardRackProfile,
  isAllowedShorterWordWithWildcards,
} from '../utils/wildcardSubanagrams';

export interface AnagramResults {
  exactMatches: string[];
  partialMatches: string[];
}

export class SqliteAnagramService {
  constructor(private readonly database: SQLiteWordDatabase = sqliteDB) {}
  
  /**
   * Buscar anagramas exactos usando índice SQL nativo
   */
  async findExactAnagrams(letters: string): Promise<string[]> {
    await this.ensureDatabase();
    
    const normalizedLetters = this.normalizeLetters(letters);
    const alphagram = this.createAlphagram(normalizedLetters);

    try {
      const words = await this.database.findAnagramsByAlphagram(alphagram);
      return words;
    } catch (error) {
      console.error('❌ SQLite exact anagram search failed:', error);
      return [];
    }
  }

  /**
   * Buscar subanagramas usando queries SQL optimizadas
   */
  async findSubAnagrams(letters: string, minLength: number = 2): Promise<string[]> {
    await this.ensureDatabase();
    
    const normalizedLetters = this.normalizeLetters(letters);
    const maxLength = normalizedLetters.length - 1; // Exclude words of same length as original
    const results: string[] = [];

    console.log(`🔍 SQLite subanagrams: "${letters}" → "${normalizedLetters}" (${minLength}-${maxLength})`);

    try {
      // Buscar por cada longitud usando índice optimizado
      for (let len = minLength; len <= maxLength; len++) {
        const words = await this.database.findWordsByLength(len);
        
        // Filtrar palabras que son subanagramas válidos
        const validSubanagrams = words
          .filter(entry => this.canMakeWord(normalizedLetters, entry.word))
          .map(entry => entry.word);
        
        results.push(...validSubanagrams);
      }

      console.log(`✅ SQLite found ${results.length} subanagrams`);
      return results.sort();
    } catch (error) {
      console.error('❌ SQLite subanagram search failed:', error);
      return [];
    }
  }

  /**
   * Find shorter rack plays while allowing zero or one blank. A second blank
   * may remain on the rack, but is never consumed by a shorter result.
   */
  async findSubAnagramsWithWildcards(letters: string, minLength: number = 2): Promise<string[]> {
    await this.ensureDatabase();

    const profile = getWildcardRackProfile(letters);
    const maxLength = profile.totalTileCount - 1;
    const results: string[] = [];

    try {
      for (let length = minLength; length <= maxLength; length++) {
        const words = await this.database.findWordsByLength(length);
        for (const entry of words) {
          if (isAllowedShorterWordWithWildcards(entry.word, letters, minLength)) {
            results.push(entry.word);
          }
        }
      }

      return Array.from(new Set(results)).sort();
    } catch (error) {
      console.error('❌ SQLite wildcard subanagram search failed:', error);
      return [];
    }
  }

  /**
   * Buscar anagramas completos (exactos + subanagramas)
   */
  async findAnagrams(letters: string, minLength: number = 2, includeSubanagrams: boolean = false): Promise<AnagramResults> {
    try {
      const exactMatches = await this.findExactAnagrams(letters);
      const partialMatches = includeSubanagrams ? await this.findSubAnagrams(letters, minLength) : [];
      
      return {
        exactMatches,
        partialMatches
      };
    } catch (error) {
      console.error('❌ SQLite anagram search failed:', error);
      return { exactMatches: [], partialMatches: [] };
    }
  }

  /**
   * Buscar palabras que se pueden formar añadiendo exactamente 1 letra adicional
   */
  async findWordsWithOneAdditionalLetter(letters: string): Promise<string[]> {
    console.log(`🔍 SQLite additional letter search: "${letters}"`);

    try {
      await this.ensureDatabase();

      const normalizedLetters = this.normalizeLetters(letters);
      const spanishLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑÇ';
      const alphagrams = Array.from(new Set(
        [...spanishLetters].map((letter) =>
          this.createAlphagram(normalizedLetters + letter)
        )
      ));

      const results = await this.database.findAnagramsByAlphagrams(alphagrams);
      console.log(`✅ SQLite found ${results.length} words with 1 additional letter`);
      return results;
    } catch (error) {
      console.error('❌ SQLite additional letter search failed:', error);
      return [];
    }
  }

  /**
   * Verificar si una palabra se puede formar con las letras disponibles
   */
  private canMakeWord(availableLetters: string, targetWord: string): boolean {
    const available = [...availableLetters.toUpperCase()];
    // targetWord should already be normalized from SQLite DB, but ensure consistency
    const needed = [...this.normalizeLetters(targetWord).toUpperCase()];

    for (const letter of needed) {
      const index = available.indexOf(letter);
      if (index === -1) return false;
      available.splice(index, 1);
    }

    return true;
  }

  /**
   * Normalizar letras para búsqueda consistente
   */
  private normalizeLetters(letters: string): string {
    return letters
      .toUpperCase()
      .replace(/CH/g, 'Ç')  // CH → Ç
      .replace(/LL/g, 'K')  // LL → K  
      .replace(/RR/g, 'W'); // RR → W
  }

  /**
   * Crear alphagram con el orden custom de Scrabble español
   */
  private createAlphagram(letters: string): string {
    const order = 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ';
    const orderMap = new Map<string, number>();
    
    // Crear mapa de posiciones para ordenamiento
    for (let i = 0; i < order.length; i++) {
      orderMap.set(order[i], i);
    }
    
    return [...letters]
      .sort((a, b) => {
        const posA = orderMap.get(a) ?? 999;
        const posB = orderMap.get(b) ?? 999;
        return posA - posB;
      })
      .join('');
  }

  /**
   * Asegurar que la base de datos esté inicializada
   */
  private async ensureDatabase(): Promise<void> {
    try {
      await this.database.init();
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw new Error('SQLite database not available');
    }
  }

  /**
   * Verificar si SQLite está disponible y tiene datos
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.ensureDatabase();
      const count = await this.database.getWordCount();
      return count > 0;
    } catch (error) {
      console.error('❌ SQLite availability check failed:', error);
      return false;
    }
  }

  /**
   * Buscar palabras que coincidan con un patrón usando la lógica existente
   * Crea un adapter de Trie para reutilizar toda la lógica de patterns
   */
  async findPatternMatches(
    pattern: string, 
    showLongerWords: boolean = false,
    maxDefaultLength: number = 8,
    targetLength?: number
  ): Promise<string[]> {
    console.log(`🔍 SQLite pattern search (using existing pattern logic): "${pattern}"`);
    
    try {
      await this.ensureDatabase();
      
      // Crear un adapter que simule la interfaz del Trie usando SQLite
      const sqliteTrieAdapter = this.createTrieAdapter();
      
      // Usar una versión simplificada de la lógica de patterns adaptada para SQLite
      return await this.findPatternMatchesSimplified(
        pattern, 
        showLongerWords, 
        maxDefaultLength, 
        targetLength
      );
      
    } catch (error) {
      console.error('❌ SQLite pattern search failed:', error);
      return [];
    }
  }

  /**
   * Crear un adapter que simule la interfaz del Trie usando SQLite
   */
  private createTrieAdapter() {
    return {
      // Implementar métodos del Trie que usa la lógica de patterns
      search: async (word: string): Promise<boolean> => {
        const results = await this.findExactAnagrams(word);
        return results.includes(word.toUpperCase());
      },
      
      getWordsStartingWith: async (prefix: string): Promise<string[]> => {
        return await this.findWordsStartingWith(prefix);
      },
      
      getAllWords: async (): Promise<string[]> => {
        return await this.database.getAllWords();
      },
      
      getWordsOfLength: async (length: number): Promise<string[]> => {
        const entries = await this.database.findWordsByLength(length);
        return entries.map(entry => entry.word);
      },
      
      getRoot: () => {
        // Devolver un objeto que simule un TrieNode root para searchTrie
        return {
          isEndOfWord: false,
          word: '',
          children: new Map(),
          // Implementar método searchTrie directamente
          searchTrie: async (pattern: RegExp, rackLetters: string = ''): Promise<string[]> => {
            return await this.searchTrieWithSQLite(pattern, rackLetters);
          }
        };
      }
    };
  }

  /**
   * Implementar searchTrie usando SQLite en lugar de recorrido recursivo del Trie
   */
  private async searchTrieWithSQLite(pattern: RegExp, rackLetters: string = ''): Promise<string[]> {
    console.log(`🔍 SQLite searchTrie: pattern=${pattern}, rack="${rackLetters}"`);
    
    const matches: string[] = [];
    const hasRackLetters = rackLetters && rackLetters.trim().length > 0;
    
    // Obtener todas las palabras (esto es ineficiente, pero funcional para empezar)
    const allWords = await this.database.getAllWords();
    
    for (const word of allWords) {
      // Probar cada palabra contra el patrón
      if (pattern.test(word)) {
        if (hasRackLetters) {
          // Si hay rack letters, validar que se puede formar la palabra
          const { validateWordPattern } = await import('@/utils/pattern/validation');
          const patternStr = pattern.toString().slice(1, -1).replace(/^\^|\$$/g, '');
          const isValidWithRack = validateWordPattern(word, patternStr, rackLetters);
          if (isValidWithRack) {
            matches.push(word);
          }
        } else {
          matches.push(word);
        }
      }
    }
    
    console.log(`✅ SQLite searchTrie found ${matches.length} matches`);
    return matches;
  }

  /**
   * Versión simplificada de findPatternMatches adaptada para SQLite
   * Implementa la lógica esencial sin depender del Trie
   */
  private async findPatternMatchesSimplified(
    pattern: string,
    showLongerWords: boolean = false,
    maxDefaultLength: number = 8,
    targetLength?: number
  ): Promise<string[]> {
    
    const query = parseUserQuery(pattern);
    const effectivePattern = query.pattern || '*';
    const rackPart = query.rack;
    const specifiedLength = query.length ?? targetLength;
    
    console.log('Processing SQLite pattern search:', { 
      patternPart: effectivePattern, 
      rackPart, 
      showLongerWords, 
      specifiedLength, 
      constraints: query.constraints
    });
    
    // Procesar digraphs
    const { processDigraphs } = await import('@/utils/digraphs');
    const processedPatternWithDigraphs = processDigraphs(effectivePattern);
    
    let matches: string[] = [];
    
    if (rackPart && rackPart.trim().length > 0) {
      // Patrón con rack - implementación simplificada
      console.log('Using rack letters for pattern:', rackPart.trim());
      matches = await this.findPatternWithRack(processedPatternWithDigraphs, rackPart.trim());
    } else {
      // Patrón sin rack - usar búsqueda directa con regex
      if (effectivePattern === '*' && specifiedLength !== null && specifiedLength !== undefined) {
        const candidates = await this.database.findWordsByLength(specifiedLength);
        matches = candidates.map((entry) => entry.word);
      } else {
        const finalPattern = processedPatternWithDigraphs.replace(/\*/g, '.*');
        const { convertPatternToRegex } = await import('@/utils/pattern/conversion');
        const regexPattern = convertPatternToRegex(finalPattern);

        console.log('Searching SQLite with pattern:', regexPattern.toString());
        matches = await this.searchTrieWithSQLite(regexPattern, '');
      }
    }
    
    console.log(`Found ${matches.length} matches before filtering:`, matches.slice(0, 10));
    
    // Apply inclusion/exclusion constraints if present
    if (query.hasConstraints) {
      matches = filterByQueryConstraints(matches, query.constraints);
      console.log(`After constraint filtering: ${matches.length} matches`);
    }
    
    // Aplicar filtros de longitud
    if (specifiedLength !== null && specifiedLength !== undefined) {
      const filtered = matches.filter(word => word.length === specifiedLength);
      console.log(`After length=${specifiedLength} filter: ${filtered.length} matches`);
      return filtered;
    }
    
    if (showLongerWords) {
      const filtered = matches.filter(word => word.length > maxDefaultLength);
      console.log(`After >8 filter: ${filtered.length} matches`);
      return filtered;
    } else {
      const filtered = matches.filter(word => word.length <= maxDefaultLength);
      console.log(`After <=8 filter: ${filtered.length} matches from`, matches);
      return filtered;
    }
  }

  /**
   * Búsqueda de patrones con rack simplificada
   */
  private async findPatternWithRack(pattern: string, rackLetters: string): Promise<string[]> {
    // Implementación básica - obtener todas las palabras y filtrar
    const allWords = await this.database.getAllWords();
    const matches: string[] = [];
    
    // Crear un regex básico del patrón
    const regexStr = '^' + pattern.replace(/\*/g, '.*').replace(/\./g, '.') + '$';
    const regexPattern = new RegExp(regexStr, 'i');
    console.log(`🔍 Regex pattern for "${pattern}": ${regexStr}`);
    
    const normalizedRack = this.normalizeLetters(rackLetters);
    const availableLetters = new Map<string, number>();
    let wildcards = 0;
    
    for (const char of normalizedRack) {
      if (char === '?') {
        wildcards++;
      } else {
        availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
      }
    }
    
    let patternMatches = 0;
    let rackFailures = 0;
    
    for (const word of allWords) {
      if (regexPattern.test(word)) {
        patternMatches++;
        if (patternMatches <= 5) console.log(`✅ Pattern match: ${word}`);
        
        if (this.canFormWordWithRackCorrect(word, pattern, availableLetters, wildcards)) {
          matches.push(word);
        } else {
          rackFailures++;
          if (rackFailures <= 3) console.log(`❌ Rack check failed for: ${word}`);
        }
      }
    }
    
    console.log(`📊 Pattern "${pattern}" with rack "${rackLetters}": ${patternMatches} pattern matches, ${rackFailures} failed rack check, ${matches.length} final matches`);
    
    return matches;
  }

  /**
   * Buscar palabras que empiecen con un prefijo
   */
  private async findWordsStartingWith(prefix: string): Promise<string[]> {
    const normalizedPrefix = this.normalizeLetters(prefix);
    const sqlPattern = normalizedPrefix + '%';
    
    // Buscar en múltiples longitudes
    const results: string[] = [];
    for (let len = normalizedPrefix.length; len <= 15; len++) {
      const candidates = await this.database.findWordsByLength(len);
      const matches = this.applyLikeFilter(candidates, sqlPattern);
      results.push(...matches);
    }
    
    return results;
  }

  /**
   * Traducir patrones con guiones (-) a formato estándar
   */
  private translateHyphenPattern(pattern: string): string {
    // -PALABRA -> *PALABRA
    if (pattern.startsWith('-') && !pattern.endsWith('-')) {
      return '*' + pattern.slice(1);
    }
    // PALABRA- -> PALABRA*  
    if (pattern.endsWith('-') && !pattern.startsWith('-')) {
      return pattern.slice(0, -1) + '*';
    }
    // -PALABRA- -> *PALABRA*
    if (pattern.startsWith('-') && pattern.endsWith('-')) {
      return '*' + pattern.slice(1, -1) + '*';
    }
    return pattern;
  }

  /**
   * Convertir patrón a SQL LIKE pattern
   */
  private convertPatternToSQL(pattern: string): string {
    return pattern
      .replace(/\*/g, '%')  // * -> % (cualquier cantidad de caracteres)
      .replace(/\./g, '_')  // . -> _ (un solo carácter)
      .toUpperCase();
  }

  /**
   * Buscar palabras por patrón SQL - optimizado para no cargar todas las palabras
   */
  private async searchByPattern(sqlPattern: string, targetLength?: number): Promise<string[]> {
    await this.ensureDatabase();
    const results: string[] = [];
    
    if (targetLength) {
      // Buscar solo en la longitud específica
      const candidates = await this.database.findWordsByLength(targetLength);
      return this.applyLikeFilter(candidates, sqlPattern);
    } else {
      // Buscar en múltiples longitudes de manera eficiente
      const estimatedLength = this.estimatePatternLength(sqlPattern);
      const minLength = Math.max(2, estimatedLength - 3);
      const maxLength = Math.min(15, estimatedLength + 3);
      
      console.log(`🎯 Estimated pattern length: ${estimatedLength}, searching lengths ${minLength}-${maxLength}`);
      
      for (let len = minLength; len <= maxLength; len++) {
        const candidates = await this.database.findWordsByLength(len);
        console.log(`📊 Length ${len}: ${candidates.length} candidates`);
        const matches = this.applyLikeFilter(candidates, sqlPattern);
        console.log(`✅ Length ${len}: ${matches.length} matches`);
        results.push(...matches);
      }
    }
    
    return results;
  }

  /**
   * Estimar la longitud del patrón para optimizar la búsqueda
   */
  private estimatePatternLength(sqlPattern: string): number {
    // Contar caracteres que no son comodines
    const fixedChars = sqlPattern.replace(/[%_]/g, '').length;
    
    // Para patrones como "%TRAS", la longitud mínima sería 4 (TRAS)
    // pero podría ser más larga con el prefijo
    if (sqlPattern.startsWith('%') && sqlPattern.endsWith('%')) {
      // Patrón tipo %WORD% - puede ser cualquier longitud, usar el mínimo + margen
      return Math.max(fixedChars, 5);
    } else if (sqlPattern.startsWith('%')) {
      // Patrón tipo %WORD - longitud mínima es la de la parte fija
      return fixedChars + 2; // +2 para posibles caracteres antes
    } else if (sqlPattern.endsWith('%')) {
      // Patrón tipo WORD% - longitud mínima es la de la parte fija
      return fixedChars + 2; // +2 para posibles caracteres después
    } else {
      // Patrón fijo con posibles _ - longitud aproximada
      return sqlPattern.length;
    }
  }

  /**
   * Aplicar filtro LIKE a las palabras candidatas
   */
  private applyLikeFilter(candidates: WordEntry[], sqlPattern: string): string[] {
    const results: string[] = [];
    
    // Convertir SQL LIKE pattern a RegExp - primero convertir % y _, luego escapar el resto
    let regexPattern = sqlPattern
      .replace(/%/g, '.*')     // % -> .* (cualquier cantidad de caracteres)
      .replace(/_/g, '.')      // _ -> . (un solo carácter)
      .replace(/[+?^${}()|[\]\\]/g, '\\$&'); // Escapar caracteres regex especiales (excepto . y *)
    
    regexPattern = '^' + regexPattern + '$'; // Anclar al inicio y final
    
    const regex = new RegExp(regexPattern, 'i');
    console.log(`🔍 Regex pattern: ${regexPattern}`);
    
    let matchCount = 0;
    for (const candidate of candidates) {
      if (regex.test(candidate.word)) {
        results.push(candidate.word);
        matchCount++;
        // Log first few matches for debugging
        if (matchCount <= 3) {
          console.log(`✅ Match: ${candidate.word}`);
        }
      }
    }
    
    console.log(`🎯 Total matches found: ${matchCount}`);
    return results;
  }

  /**
   * Filtrar palabras por letras disponibles en el rack
   */
  private filterByRack(candidates: string[], rackLetters: string, basePattern: string): string[] {
    const results: string[] = [];
    const normalizedRack = this.normalizeLetters(rackLetters);
    
    // Contar letras disponibles en el rack
    const availableLetters = new Map<string, number>();
    let wildcards = 0;
    
    for (const char of normalizedRack) {
      if (char === '?') {
        wildcards++;
      } else {
        availableLetters.set(char, (availableLetters.get(char) || 0) + 1);
      }
    }
    
    for (const word of candidates) {
      if (this.canFormWordWithRack(word, availableLetters, wildcards, basePattern)) {
        results.push(word);
      }
    }
    
    return results;
  }

  /**
   * Verificar si una palabra se puede formar con el rack disponible
   * CORREGIDO: Solo verifica letras que NO están fijas en el patrón (las fijas ya están en el tablero)
   */
  private canFormWordWithRackCorrect(
    word: string,
    pattern: string, 
    availableLetters: Map<string, number>, 
    wildcards: number
  ): boolean {
    // Identificar qué letras están fijas en el patrón vs cuáles necesitamos del atril
    const fixedPositions = new Set<number>();
    const fixedLetters = new Map<string, number>();
    
    // Analizar el patrón para identificar letras fijas
    for (let i = 0; i < pattern.length; i++) {
      const patternChar = pattern[i];
      if (patternChar !== '.' && patternChar !== '*') {
        // Esta es una letra fija en el tablero
        fixedPositions.add(i);
        const wordChar = word[i];
        if (wordChar) {
          fixedLetters.set(wordChar, (fixedLetters.get(wordChar) || 0) + 1);
        }
      }
    }
    
    // Contar letras que necesitamos formar con el atril (excluyendo las fijas)
    const rackNeededLetters = new Map<string, number>();
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      
      // Si esta posición corresponde a una letra fija, no la contamos
      if (i < pattern.length && !fixedPositions.has(i)) {
        rackNeededLetters.set(char, (rackNeededLetters.get(char) || 0) + 1);
      } else if (i >= pattern.length) {
        // Letras adicionales por el * también vienen del atril
        rackNeededLetters.set(char, (rackNeededLetters.get(char) || 0) + 1);
      }
    }
    
    // Clonar letras disponibles para no modificar el original
    const available = new Map(availableLetters);
    let remainingWildcards = wildcards;
    
    // Verificar si podemos formar las letras necesarias del atril
    for (const [letter, needed] of rackNeededLetters) {
      const availableCount = available.get(letter) || 0;
      
      if (availableCount >= needed) {
        // Tenemos suficientes letras normales
        available.set(letter, availableCount - needed);
      } else {
        // Necesitamos usar wildcards
        const shortfall = needed - availableCount;
        if (remainingWildcards >= shortfall) {
          remainingWildcards -= shortfall;
          available.set(letter, 0);
        } else {
          return false; // No tenemos suficientes letras ni wildcards
        }
      }
    }
    
    return true;
  }

  /**
   * Verificar si una palabra se puede formar con el rack disponible (método legacy)
   */
  private canFormWordWithRack(
    word: string, 
    availableLetters: Map<string, number>, 
    wildcards: number,
    basePattern: string
  ): boolean {
    // Clonar letras disponibles para no modificar el original
    const available = new Map(availableLetters);
    let remainingWildcards = wildcards;
    
    // Contar letras necesarias en la palabra
    const neededLetters = new Map<string, number>();
    for (const char of word) {
      neededLetters.set(char, (neededLetters.get(char) || 0) + 1);
    }
    
    // Verificar si podemos formar la palabra
    for (const [letter, needed] of neededLetters) {
      const availableCount = available.get(letter) || 0;
      
      if (availableCount >= needed) {
        // Tenemos suficientes letras normales
        available.set(letter, availableCount - needed);
      } else {
        // Necesitamos usar wildcards
        const shortfall = needed - availableCount;
        if (remainingWildcards >= shortfall) {
          remainingWildcards -= shortfall;
          available.set(letter, 0);
        } else {
          return false; // No tenemos suficientes letras ni wildcards
        }
      }
    }
    
    return true;
  }

  /**
   * Buscar anagramas con wildcards (?). Soporta hasta 2 wildcards.
   */
  async findAnagramsWithWildcards(
    letters: string,
    maxWildcards: number = 2,
    includeSubanagrams = false,
  ): Promise<{
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    shorterMatches: string[];
  }> {
    const wildcardCount = (letters.match(/\?/g) || []).length;
    
    if (wildcardCount > maxWildcards) {
      console.log(`❌ Too many wildcards (${wildcardCount}), max allowed: ${maxWildcards}`);
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], shorterMatches: [] };
    }

    const lettersOnly = letters.replace(/\?/g, '');
    const processedInput = this.normalizeLetters(lettersOnly);

    console.log(`🔍 SQLite wildcards search: "${letters}" → ${wildcardCount} wildcards, letters: "${processedInput}"`);

    let exactMatches: string[] = [];
    let wildcardMatches: string[] = [];
    let additionalWildcardMatches: string[] = [];
    let shorterMatches: string[] = [];

    try {
      await this.ensureDatabase();

      // Anagramas exactos sin wildcards
      if (wildcardCount === 0) {
        const results = await this.findAnagrams(lettersOnly, 2, false);
        exactMatches = results.exactMatches;
      }

      // Palabras con wildcards (longitud exacta: letras + wildcards)
      if (wildcardCount > 0) {
        wildcardMatches = await this.findWordsWithWildcards(processedInput, wildcardCount);
      }

      // Palabras con una letra adicional (longitud: letras + wildcards + 1)
      if (wildcardCount >= 1) {
        additionalWildcardMatches = await this.findWordsWithWildcardsAdditional(processedInput, wildcardCount + 1);
        if (includeSubanagrams) {
          shorterMatches = await this.findSubAnagramsWithWildcards(letters, 2);
        }
      }

      console.log(`✅ SQLite wildcards found: exact=${exactMatches.length}, wildcards=${wildcardMatches.length}, additional=${additionalWildcardMatches.length}`);

      return {
        exactMatches: Array.from(new Set(exactMatches)),
        wildcardMatches: Array.from(new Set(wildcardMatches)),
        additionalWildcardMatches: Array.from(new Set(additionalWildcardMatches)),
        shorterMatches: Array.from(new Set(shorterMatches))
      };

    } catch (error) {
      console.error('❌ SQLite wildcards search failed:', error);
      return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], shorterMatches: [] };
    }
  }

  /**
   * Buscar palabras que se pueden formar con wildcards (longitud exacta)
   */
  private async findWordsWithWildcards(letters: string, wildcardCount: number): Promise<string[]> {
    const matches: string[] = [];
    const lettersLength = letters.length;
    
    // Buscar solo en longitud exacta: letras + wildcards
    const targetLength = lettersLength + wildcardCount;
    
    console.log(`🔍 SQLite wildcards: searching length ${targetLength} (${lettersLength} letters + ${wildcardCount} wildcards)`);
    
    const candidates = await this.database.findWordsByLength(targetLength);
    console.log(`📊 Found ${candidates.length} candidates of length ${targetLength}`);
    
    for (const candidate of candidates) {
      if (this.canFormWordWithWildcardsSimple(candidate.word, letters, wildcardCount)) {
        matches.push(candidate.word);
      }
    }
    
    console.log(`🎯 SQLite wildcards found ${matches.length} words with ${wildcardCount} wildcards (exact length)`);
    return matches;
  }

  /**
   * Buscar palabras con wildcards + una letra adicional
   */
  private async findWordsWithWildcardsAdditional(letters: string, totalWildcards: number): Promise<string[]> {
    const matches: string[] = [];
    const lettersLength = letters.length;
    
    // Buscar en longitud: letras + wildcards + 1 letra adicional
    const targetLength = lettersLength + totalWildcards;
    
    console.log(`🔍 SQLite additional: searching length ${targetLength} (${lettersLength} letters + ${totalWildcards} total wildcards)`);
    
    const candidates = await this.database.findWordsByLength(targetLength);
    console.log(`📊 Found ${candidates.length} candidates of length ${targetLength} for additional search`);
    
    for (const candidate of candidates) {
      if (this.canFormWordWithWildcardsSimple(candidate.word, letters, totalWildcards)) {
        matches.push(candidate.word);
      }
    }
    
    console.log(`🎯 SQLite additional found ${matches.length} words with additional letter`);
    return matches;
  }

  /**
   * Verificar si una palabra se puede formar con las letras disponibles + wildcards
   */
  private canFormWordWithWildcardsSimple(word: string, availableLetters: string, wildcards: number): boolean {
    const wordLetters = word.toUpperCase().split('');
    const available = availableLetters.toUpperCase().split('');
    
    // Contar letras disponibles
    const availableCount = new Map<string, number>();
    for (const letter of available) {
      availableCount.set(letter, (availableCount.get(letter) || 0) + 1);
    }
    
    // Contar letras necesarias
    const neededCount = new Map<string, number>();
    for (const letter of wordLetters) {
      neededCount.set(letter, (neededCount.get(letter) || 0) + 1);
    }
    
    let wildcardsNeeded = 0;
    
    // Verificar cada letra necesaria
    for (const [letter, needed] of neededCount) {
      const available_of_letter = availableCount.get(letter) || 0;
      if (needed > available_of_letter) {
        wildcardsNeeded += needed - available_of_letter;
      }
    }
    
    return wildcardsNeeded <= wildcards;
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async getStats(): Promise<{ wordCount: number; isReady: boolean }> {
    try {
      await this.ensureDatabase();
      const wordCount = await this.database.getWordCount();
      return {
        wordCount,
        isReady: wordCount > 0
      };
    } catch (error) {
      return {
        wordCount: 0,
        isReady: false
      };
    }
  }
}

// Instancia singleton bendecida 🙏
export const sqliteAnagramService = new SqliteAnagramService();
