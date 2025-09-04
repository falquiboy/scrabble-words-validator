// Servicio para generar anagramas y subanagramas desde Supabase
import { supabase } from '@/integrations/supabase/client';
import { processDigraphs } from '@/utils/digraphs';

export interface AnagramResult {
  word: string;
  length: number;
  alphagram: string;
}

export class AnagramService {
  private tableName = 'lexicon_keys';

  /**
   * Crear alphagram ordenado para búsqueda
   */
  private createAlphagram(letters: string): string {
    const order = 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ';
    const orderMap = new Map<string, number>();
    
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
   * Verificar si una palabra es formable con las fichas disponibles
   */
  private canFormWord(word: string, availableLetters: string): boolean {
    const letterCount: { [key: string]: number } = {};
    
    // Contar letras disponibles
    for (const letter of availableLetters) {
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    }

    // Verificar si la palabra puede formarse
    for (const letter of word) {
      if (!letterCount[letter] || letterCount[letter] === 0) {
        return false;
      }
      letterCount[letter]--;
    }

    return true;
  }

  /**
   * Generar todas las combinaciones posibles de letras
   */
  private generateCombinations(letters: string): string[] {
    const combinations = new Set<string>();
    const lettersArray = [...letters];
    
    // Generar todas las combinaciones posibles (powerset)
    for (let i = 1; i < (1 << lettersArray.length); i++) {
      let combination = '';
      for (let j = 0; j < lettersArray.length; j++) {
        if (i & (1 << j)) {
          combination += lettersArray[j];
        }
      }
      if (combination.length >= 2) { // Solo palabras de 2+ letras
        combinations.add(this.createAlphagram(combination));
      }
    }
    
    return Array.from(combinations);
  }

  /**
   * Buscar anagramas exactos (usando todas las fichas)
   */
  async findExactAnagrams(tiles: string[]): Promise<AnagramResult[]> {
    try {
      const letters = tiles.join('').toUpperCase();
      const processedLetters = processDigraphs(letters);
      const alphagram = this.createAlphagram(processedLetters);

      console.log(`🔍 Buscando anagramas exactos para: ${letters} -> ${processedLetters} (alphagram: ${alphagram})`);

      const { data: anagrams, error } = await supabase
        .from(this.tableName)
        .select('norm_word, norm_alph, norm_length')
        .eq('norm_alph', alphagram)
        .order('norm_word');

      if (error) {
        console.error('❌ Error buscando anagramas exactos:', error);
        return [];
      }

      const results = anagrams?.map(entry => ({
        word: entry.norm_word,
        length: entry.norm_length,
        alphagram: entry.norm_alph
      })) || [];

      console.log(`✅ Encontrados ${results.length} anagramas exactos`);
      return results;

    } catch (error) {
      console.error('❌ Error en findExactAnagrams:', error);
      return [];
    }
  }

  /**
   * Buscar subanagramas (usando menos fichas)
   */
  async findSubanagrams(tiles: string[], minLength: number = 2, maxResults: number = 100): Promise<AnagramResult[]> {
    try {
      const letters = tiles.join('').toUpperCase();
      const processedLetters = processDigraphs(letters);
      
      console.log(`🔍 Buscando subanagramas para: ${letters} -> ${processedLetters} (min length: ${minLength})`);

      const results: AnagramResult[] = [];
      const maxLength = letters.length - 1;
      
      // Buscar por cada longitud posible
      for (let len = minLength; len <= maxLength && results.length < maxResults; len++) {
        const { data: words, error } = await supabase
          .from(this.tableName)
          .select('norm_word, norm_alph, norm_length')
          .eq('norm_length', len)
          .limit(500); // Límite por consulta

        if (!error && words) {
          // Filtrar palabras que se pueden formar con las fichas disponibles
          const validWords = words.filter(entry => {
            return this.canFormWord(entry.norm_word, processedLetters);
          }).map(entry => ({
            word: entry.norm_word,
            length: entry.norm_length,
            alphagram: entry.norm_alph
          }));

          results.push(...validWords);
        }
      }

      // Ordenar por longitud descendente, luego alfabéticamente
      results.sort((a, b) => {
        if (a.length !== b.length) {
          return b.length - a.length;
        }
        return a.word.localeCompare(b.word);
      });

      console.log(`✅ Encontrados ${results.length} subanagramas`);
      return results.slice(0, maxResults);

    } catch (error) {
      console.error('❌ Error en findSubanagrams:', error);
      return [];
    }
  }

  /**
   * Buscar todos los anagramas y subanagramas
   */
  async findAllAnagrams(tiles: string[]): Promise<{
    exactAnagrams: AnagramResult[];
    subAnagrams: AnagramResult[];
    totalWords: number;
  }> {
    try {
      console.log(`🎯 Generando todas las combinaciones para fichas: [${tiles.join(', ')}]`);
      
      const [exactAnagrams, subAnagrams] = await Promise.all([
        this.findExactAnagrams(tiles),
        this.findSubanagrams(tiles)
      ]);

      const totalWords = exactAnagrams.length + subAnagrams.length;

      return {
        exactAnagrams,
        subAnagrams,
        totalWords
      };
    } catch (error) {
      console.error('❌ Error en findAllAnagrams:', error);
      return {
        exactAnagrams: [],
        subAnagrams: [],
        totalWords: 0
      };
    }
  }
}

// Instancia singleton
export const anagramService = new AnagramService();