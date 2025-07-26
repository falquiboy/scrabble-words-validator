/**
 * Servicio híbrido que actúa como un Trie pero usa IndexedDB como fallback
 * Mantiene la API exacta del Trie legacy para compatibilidad total
 */

import { Trie } from '@/utils/trie';
import { indexedDbAnagramService } from './IndexedDbAnagramService';

export class HybridTrieService {
  private actualTrie: Trie | null = null;
  private isTrieReady: boolean = false;

  constructor(trie: Trie | null = null) {
    this.actualTrie = trie;
    this.isTrieReady = trie !== null;
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
   * Método search - API exacta del Trie legacy
   */
  search(word: string): boolean {
    if (this.isTrieReady && this.actualTrie) {
      // Usar Trie si está disponible (ultra-rápido)
      return this.actualTrie.search(word);
    } else {
      // Fallback a validación básica por ahora
      // TODO: Implementar validación con IndexedDB si es necesario
      console.log(`⚡ Hybrid search fallback for: ${word}`);
      return false; // Por ahora, solo el Trie valida
    }
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
   * Método findAnagrams async para cuando necesitemos IndexedDB fallback
   */
  async findAnagramsAsync(letters: string): Promise<string[]> {
    if (this.isTrieReady && this.actualTrie) {
      // Usar Trie si está disponible (ultra-rápido)
      console.log(`🚀 Using Trie for async anagrams: ${letters}`);
      return this.actualTrie.findAnagrams(letters);
    } else {
      // Fallback a IndexedDB (rápido e instantáneo)
      console.log(`⚡ Using IndexedDB fallback for async anagrams: ${letters}`);
      const results = await indexedDbAnagramService.findAnagrams(letters, 2, false);
      return results.exactMatches;
    }
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
   * Método findAnagramsWithSubAnagrams - API extendida
   */
  async findAnagramsWithSubAnagrams(letters: string, includeSubanagrams: boolean = false): Promise<{
    exactMatches: string[];
    shorterMatches: string[];
  }> {
    if (this.isTrieReady && this.actualTrie) {
      // Usar Trie si está disponible
      console.log(`🚀 Using Trie for extended anagrams: ${letters}`);
      const exactMatches = this.actualTrie.findAnagrams(letters);
      
      // Para subanagramas, usar también IndexedDB ya que el Trie no los tiene optimizados
      let shorterMatches: string[] = [];
      if (includeSubanagrams) {
        const results = await indexedDbAnagramService.findAnagrams(letters, 2, true);
        shorterMatches = results.partialMatches;
      }
      
      return { exactMatches, shorterMatches };
    } else {
      // Fallback completo a IndexedDB
      console.log(`⚡ Using IndexedDB fallback for extended anagrams: ${letters}`);
      const results = await indexedDbAnagramService.findAnagrams(letters, 2, includeSubanagrams);
      return {
        exactMatches: results.exactMatches,
        shorterMatches: results.partialMatches
      };
    }
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
   * Obtener información de qué proveedor se está usando
   */
  getCurrentProvider(): 'trie' | 'indexeddb' | 'none' {
    if (this.isTrieReady) return 'trie';
    if (this.isIndexedDbReady()) return 'indexeddb';
    return 'none';
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats(): { provider: string; ready: boolean; trieReady: boolean } {
    return {
      provider: this.getCurrentProvider(),
      ready: this.isReady(),
      trieReady: this.isTrieReady
    };
  }
}

// Singleton instance
export const hybridTrieService = new HybridTrieService();