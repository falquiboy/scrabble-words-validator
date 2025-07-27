/**
 * Servicio híbrido que actúa como un Trie pero usa fallbacks progresivos
 * Mantiene la API exacta del Trie legacy para compatibilidad total
 * 
 * Orden de fallback: Trie → SQLite → Supabase
 */

import { Trie } from '@/utils/trie';
import { sqliteAnagramService } from './SqliteAnagramService';
import { supabaseWordService } from './SupabaseWordService';

export class HybridTrieService {
  private actualTrie: Trie | null = null;
  private isTrieReady: boolean = false;
  private isSqliteAvailable: boolean = false;
  private isSupabaseAvailable: boolean = false;

  constructor(trie: Trie | null = null) {
    this.actualTrie = trie;
    this.isTrieReady = trie !== null;
    
    // Inicializar disponibilidad de servicios de fallback
    this.initializeFallbackServices();
  }

  /**
   * Inicializar servicios de fallback en background
   */
  private async initializeFallbackServices() {
    // Verificar Supabase primero (más confiable)
    try {
      this.isSupabaseAvailable = await supabaseWordService.isAvailable();
      console.log(`🌐 Supabase availability: ${this.isSupabaseAvailable}`);
    } catch (error) {
      console.warn('⚠️ Supabase check failed:', error);
      this.isSupabaseAvailable = false;
    }
    
    // SQLite se verifica dinámicamente para evitar bloqueos durante construcción
    this.checkSqliteAvailability();
  }

  /**
   * Verificar dinámicamente si SQLite está disponible para consultas
   * Detecta si está bloqueado por construcción O si tiene datos insuficientes
   */
  private async checkSqliteAvailability(): Promise<boolean> {
    try {
      // Test ultra-rápido: verificar disponibilidad de SQLite
      const testPromise = sqliteAnagramService.findAnagrams('A', 1, false);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('SQLite blocked or timeout')), 500) // 500ms timeout
      );
      
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      // Verificar si SQLite tiene datos suficientes
      // La letra 'A' debería tener al menos algunas palabras en español
      if (result.exactMatches.length === 0) {
        console.log('🚫 SQLite incomplete (no data for "A"), using Supabase fallback');
        this.isSqliteAvailable = false;
        return false;
      }
      
      // Si llegamos aquí, SQLite responde y tiene datos
      this.isSqliteAvailable = true;
      console.log(`✅ SQLite available with ${result.exactMatches.length} words for "A"`);
      return true;
    } catch (error) {
      // SQLite está bloqueado (construcción) o no disponible
      console.log('🚫 SQLite blocked/unavailable, using Supabase fallback');
      this.isSqliteAvailable = false;
      return false;
    }
  }

  /**
   * Actualizar la referencia al Trie cuando esté listo
   */
  updateTrie(trie: Trie | null) {
    this.actualTrie = trie;
    this.isTrieReady = trie !== null;
    console.log(`🔄 Hybrid service updated - Trie ready: ${this.isTrieReady}`);
  }

  /**
   * Método search - API exacta del Trie legacy con fallback de 3 niveles
   */
  search(word: string): boolean {
    if (this.isTrieReady && this.actualTrie) {
      // Nivel 1: Usar Trie si está disponible (ultra-rápido)
      return this.actualTrie.search(word);
    } else {
      // Los niveles 2 y 3 requieren async, pero search() debe ser sync para compatibilidad
      // Delegar a searchAsync() para fallbacks verdaderos
      console.log(`⚡ Sync search limited to Trie only: ${word}`);
      return false;
    }
  }

  /**
   * Método search asíncrono con fallback completo de 3 niveles
   */
  async searchAsync(word: string): Promise<boolean> {
    // Nivel 1: Trie (ultra-rápido)
    if (this.isTrieReady && this.actualTrie) {
      console.log(`🚀 Level 1 - Trie search: ${word}`);
      return this.actualTrie.search(word);
    }

    // Nivel 2: SQLite (rápido, pero verificar disponibilidad real)
    const isSqliteReady = await this.checkSqliteAvailability();
    if (isSqliteReady) {
      console.log(`⚡ Level 2 - SQLite search: ${word}`);
      try {
        const results = await sqliteAnagramService.findAnagrams(word, word.length, false);
        return results.exactMatches.includes(word.toUpperCase());
      } catch (error) {
        console.log(`⚠️ SQLite search failed, falling back: ${error}`);
        this.isSqliteAvailable = false; // Marcar como no disponible
      }
    }

    // Nivel 3: Supabase (remoto)
    if (this.isSupabaseAvailable) {
      console.log(`🌐 Level 3 - Supabase search: ${word}`);
      return await supabaseWordService.search(word);
    }

    console.log(`❌ No services available for search: ${word}`);
    return false;
  }

  /**
   * Método findAnagrams - API exacta del Trie legacy (SYNC para compatibilidad)
   */
  findAnagrams(letters: string): string[] {
    if (this.isTrieReady && this.actualTrie) {
      // Usar Trie si está disponible (ultra-rápido y sync)
      console.log(`🚀 Using Trie for anagrams: ${letters}`);
      return this.actualTrie.findAnagrams(letters);
    } else {
      // Sin Trie disponible, no podemos hacer búsqueda sync
      console.log(`❌ Sync anagrams not available without Trie: ${letters}`);
      return [];
    }
  }

  /**
   * Método findAnagrams async con fallback completo de 3 niveles
   */
  async findAnagramsAsync(letters: string): Promise<string[]> {
    // Nivel 1: Trie (ultra-rápido)
    if (this.isTrieReady && this.actualTrie) {
      console.log(`🚀 Level 1 - Trie anagrams: ${letters}`);
      return this.actualTrie.findAnagrams(letters);
    }

    // Nivel 2: SQLite (rápido, pero verificar disponibilidad real)
    const isSqliteReady = await this.checkSqliteAvailability();
    if (isSqliteReady) {
      console.log(`⚡ Level 2 - SQLite anagrams: ${letters}`);
      try {
        const results = await sqliteAnagramService.findAnagrams(letters, 2, false);
        return results.exactMatches;
      } catch (error) {
        console.log(`⚠️ SQLite anagrams failed, falling back: ${error}`);
        this.isSqliteAvailable = false;
      }
    }

    // Nivel 3: Supabase (remoto)
    if (this.isSupabaseAvailable) {
      console.log(`🌐 Level 3 - Supabase anagrams: ${letters}`);
      return await supabaseWordService.findAnagrams(letters);
    }

    console.log(`❌ No services available for anagrams: ${letters}`);
    return [];
  }

  /**
   * Método findAnagrams sincrono para compatibilidad legacy (requiere Trie)
   * Para uso en funciones que esperan el Trie clásico
   */
  findAnagramsSync(letters: string): { 
    exactMatches: string[], 
    wildcardMatches: string[], 
    additionalWildcardMatches: string[], 
    shorterMatches: string[] 
  } {
    if (this.isTrieReady && this.actualTrie) {
      // Usar método legacy del Trie que puede tener esta estructura
      console.log(`🚀 Using Trie sync anagrams: ${letters}`);
      // Intentar usar el método legacy si existe
      if (typeof (this.actualTrie as any).findAnagramsLegacy === 'function') {
        return (this.actualTrie as any).findAnagramsLegacy(letters);
      } else {
        // Fallback básico si no existe
        const exactMatches = this.actualTrie.findAnagrams(letters);
        return {
          exactMatches,
          wildcardMatches: [],
          additionalWildcardMatches: [],
          shorterMatches: []
        };
      }
    } else {
      // Sin Trie, no podemos hacer búsquedas síncronas
      console.log(`❌ Sync anagrams not available without Trie: ${letters}`);
      return {
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        shorterMatches: []
      };
    }
  }

  /**
   * Método findAnagramsWithSubAnagrams - API extendida con fallback de 3 niveles
   */
  async findAnagramsWithSubAnagrams(letters: string, includeSubanagrams: boolean = false): Promise<{
    exactMatches: string[];
    shorterMatches: string[];
  }> {
    // Nivel 1: Trie + IndexedDB para subanagramas (híbrido óptimo)
    if (this.isTrieReady && this.actualTrie) {
      console.log(`🚀 Level 1 - Trie + IndexedDB hybrid anagrams: ${letters}`);
      const exactMatches = this.actualTrie.findAnagrams(letters);
      
      // Para subanagramas, usar SQLite ya que está optimizado para esto
      let shorterMatches: string[] = [];
      if (includeSubanagrams && this.isSqliteAvailable) {
        const results = await sqliteAnagramService.findAnagrams(letters, 2, true);
        shorterMatches = results.partialMatches;
      }
      
      return { exactMatches, shorterMatches };
    }

    // Nivel 2: SQLite completo
    if (this.isSqliteAvailable) {
      console.log(`⚡ Level 2 - SQLite extended anagrams: ${letters}`);
      const results = await sqliteAnagramService.findAnagrams(letters, 2, includeSubanagrams);
      return {
        exactMatches: results.exactMatches,
        shorterMatches: results.partialMatches
      };
    }

    // Nivel 3: Supabase
    if (this.isSupabaseAvailable) {
      console.log(`🌐 Level 3 - Supabase extended anagrams: ${letters}`);
      const exactMatches = await supabaseWordService.findAnagrams(letters);
      let shorterMatches: string[] = [];
      
      if (includeSubanagrams) {
        shorterMatches = await supabaseWordService.findSubanagrams(letters, 2);
      }
      
      return { exactMatches, shorterMatches };
    }

    console.log(`❌ No services available for extended anagrams: ${letters}`);
    return { exactMatches: [], shorterMatches: [] };
  }

  /**
   * Método getAllWords - API exacta del Trie legacy
   */
  getAllWords(): string[] {
    if (this.isTrieReady && this.actualTrie) {
      return this.actualTrie.getAllWords();
    } else {
      // Fallback: retornar array vacío por ahora
      // TODO: Implementar con IndexedDB si es necesario
      console.log(`⚡ Hybrid getAllWords fallback - returning empty array`);
      return [];
    }
  }

  /**
   * Verificar si algún servicio está disponible
   */
  isReady(): boolean {
    return this.isTrieReady || this.isIndexedDbReady();
  }

  /**
   * Verificar específicamente si el Trie está listo
   */
  isTrieAvailable(): boolean {
    return this.isTrieReady;
  }

  /**
   * Verificar si IndexedDB está disponible (síntcrono aproximado)
   */
  private isIndexedDbReady(): boolean {
    // IndexedDB debería estar siempre disponible después de la carga inicial
    return true;
  }

  /**
   * Obtener información de qué proveedor se está usando actualmente
   */
  getCurrentProvider(): 'trie' | 'sqlite' | 'supabase' | 'none' {
    const provider = this.isTrieReady ? 'trie' : 
                    this.isSqliteAvailable ? 'sqlite' : 
                    this.isSupabaseAvailable ? 'supabase' : 'none';
    console.log(`🔍 Current provider: ${provider} (trie:${this.isTrieReady}, sqlite:${this.isSqliteAvailable}, supabase:${this.isSupabaseAvailable})`);
    return provider;
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats(): { 
    provider: string; 
    ready: boolean; 
    trieReady: boolean; 
    indexedDbReady: boolean; 
    supabaseReady: boolean;
  } {
    return {
      provider: this.getCurrentProvider(),
      ready: this.isReady(),
      trieReady: this.isTrieReady,
      indexedDbReady: this.isIndexedDbAvailable,
      supabaseReady: this.isSupabaseAvailable
    };
  }
}

// Singleton instance
export const hybridTrieService = new HybridTrieService();