/**
 * SqliteAnagramService - Servicio de anagramas usando SQLite WASM
 * Reemplaza IndexedDbAnagramService con poder SQL superior
 * 
 * ¡Bendecido con transacciones rápidas y queries poderosas! 🙏⚡
 */

import { sqliteDB, WordEntry } from './SQLiteWordDatabase';

export interface AnagramResults {
  exactMatches: string[];
  partialMatches: string[];
}

export class SqliteAnagramService {
  
  /**
   * Buscar anagramas exactos usando índice SQL nativo
   */
  async findExactAnagrams(letters: string): Promise<string[]> {
    await this.ensureDatabase();
    
    const normalizedLetters = this.normalizeLetters(letters);
    const alphagram = this.createAlphagram(normalizedLetters);

    try {
      const words = await sqliteDB.findAnagramsByAlphagram(alphagram);
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
        const words = await sqliteDB.findWordsByLength(len);
        
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
   * Verificar si una palabra se puede formar con las letras disponibles
   */
  private canMakeWord(availableLetters: string, targetWord: string): boolean {
    const available = [...availableLetters.toUpperCase()];
    const needed = [...targetWord.toUpperCase()];

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
      await sqliteDB.init();
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
      const count = await sqliteDB.getWordCount();
      return count > 0;
    } catch (error) {
      console.error('❌ SQLite availability check failed:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async getStats(): Promise<{ wordCount: number; isReady: boolean }> {
    try {
      await this.ensureDatabase();
      const wordCount = await sqliteDB.getWordCount();
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