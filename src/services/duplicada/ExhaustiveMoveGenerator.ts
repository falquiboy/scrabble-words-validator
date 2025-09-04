// Generador exhaustivo de movimientos para Scrabble en español
// Genera TODAS las jugadas posibles dada una situación del tablero y un atril
// Maneja correctamente los dígrafos CH, LL, RR como unidades indivisibles

import { BoardCell } from '@/types/duplicada/tournament';
import { TileBagManager } from '@/utils/duplicada/tiles';

export interface ScrabbleMove {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical';
  tilesPlaced: Array<{
    row: number;
    col: number;
    letter: string;
    isWildcard: boolean;
  }>;
  score: number;
  crossWords: Array<{
    word: string;
    row: number;
    col: number;
    direction: 'horizontal' | 'vertical';
  }>;
}

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
}

export class ExhaustiveMoveGenerator {
  private validWords: Set<string> = new Set();
  private wordsByAlphagram: Map<string, string[]> = new Map();
  private trie: TrieNode;
  private isLoaded = false;
  private debugShown = false;
  private bestScoreSoFar = 0;
  private movesEvaluated = 0;
  private movesPruned = 0;
  
  // Valores de las fichas en Scrabble español
  private readonly TILE_VALUES: Record<string, number> = {
    'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1, 'L': 1, 'N': 1, 'R': 1, 'S': 1, 'T': 1,
    'D': 2, 'G': 2,
    'B': 3, 'C': 3, 'M': 3, 'P': 3,
    'F': 4, 'H': 4, 'V': 4, 'Y': 4,
    'Ç': 5, 'Q': 5,  // Ç representa CH
    'J': 8, 'K': 8, 'Ñ': 8, 'W': 8, 'X': 8,  // K representa LL, W representa RR
    'Z': 10,
    '?': 0 // Comodín
  };

  // Multiplicadores del tablero
  private readonly BOARD_MULTIPLIERS = [
    ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW'],
    ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
    ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
    ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '', '', 'DL'],
    ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
    ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
    ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
    ['TW', '', '', 'DL', '', '', '', '*', '', '', '', 'DL', '', '', 'TW'],
    ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
    ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
    ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
    ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '', '', 'DL'],
    ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
    ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
    ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW']
  ];

  constructor() {
    console.log('🎯 Inicializando generador exhaustivo de movimientos');
    this.trie = { children: new Map(), isEndOfWord: false };
    this.loadValidWords();
  }

  /**
   * Genera el alfagrama de una palabra (letras ordenadas alfabéticamente)
   * Maneja correctamente Ñ y Ç en el orden alfabético español
   */
  private generateAlphagram(word: string): string {
    // Orden personalizado para el alfabeto español incluyendo dígrafos
    const spanishOrder = 'ABCÇDEFGHIJKLMNÑOPQRSTUVWXYZ';
    
    return word.split('').sort((a, b) => {
      const indexA = spanishOrder.indexOf(a);
      const indexB = spanishOrder.indexOf(b);
      return indexA - indexB;
    }).join('');
  }

  /**
   * Agrega una palabra al Trie
   */
  private addToTrie(word: string): void {
    let node = this.trie;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, {
          children: new Map(),
          isEndOfWord: false
        });
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }

  /**
   * Estima la puntuación máxima posible para una posición
   * Usado para podar búsquedas que no pueden superar el mejor score actual
   */
  private estimateMaxScore(
    rack: string[],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][]
  ): number {
    let maxScore = 0;
    let wordMultiplier = 1;
    
    // Calcular valor máximo de las fichas del rack
    const rackValues = rack.map(tile => {
      if (tile === '?') return 0;
      return this.TILE_VALUES[tile] || 0;
    }).sort((a, b) => b - a); // Ordenar de mayor a menor
    
    // Simular colocación de las mejores fichas en las mejores posiciones
    let rackIndex = 0;
    for (let i = 0; i < 7 && rackIndex < rackValues.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (row >= 15 || col >= 15) break;
      
      if (!board[row][col].tile) {
        const multiplier = this.BOARD_MULTIPLIERS[row][col];
        let letterMultiplier = 1;
        
        switch (multiplier) {
          case 'DL': letterMultiplier = 2; break;
          case 'TL': letterMultiplier = 3; break;
          case 'DW': case '*': wordMultiplier *= 2; break;
          case 'TW': wordMultiplier *= 3; break;
        }
        
        maxScore += rackValues[rackIndex] * letterMultiplier;
        rackIndex++;
      }
    }
    
    maxScore *= wordMultiplier;
    
    // Agregar bonus si se usan las 7 fichas
    if (rackIndex === 7) {
      maxScore += 50;
    }
    
    return maxScore;
  }

  /**
   * Encuentra todas las palabras válidas que se pueden formar con un rack
   * Usa el método de alfagramas para eficiencia
   */
  private findValidWordsFromRack(rack: string[]): string[] {
    const validWords: Set<string> = new Set();
    const wildcardCount = rack.filter(tile => tile === '?').length;
    const regularTiles = rack.filter(tile => tile !== '?');
    
    console.log(`🎯 Buscando palabras con rack: [${rack.join(', ')}] (${wildcardCount} comodines)`);
    
    if (wildcardCount === 0) {
      // Sin comodines: buscar todos los subconjuntos
      this.findWordsWithoutWildcards(regularTiles, validWords);
    } else {
      // Con comodines: iterar por cada letra posible
      this.findWordsWithWildcards(regularTiles, wildcardCount, validWords);
    }
    
    const wordsArray = Array.from(validWords);
    console.log(`✅ Encontradas ${wordsArray.length} palabras válidas del rack`);
    
    // Mostrar algunas palabras de ejemplo, priorizando las largas
    const sorted = wordsArray.sort((a, b) => b.length - a.length);
    console.log(`📝 Ejemplos: ${sorted.slice(0, 10).join(', ')}`);
    
    return wordsArray;
  }

  /**
   * Encuentra palabras sin comodines usando alfagramas
   */
  private findWordsWithoutWildcards(tiles: string[], validWords: Set<string>): void {
    // Para cada longitud posible (2 a 7)
    for (let length = Math.min(tiles.length, 7); length >= 2; length--) {
      // Generar todas las combinaciones de esa longitud
      this.generateCombinations(tiles, length, [], (combination) => {
        const alphagram = this.generateAlphagram(combination.join(''));
        const words = this.wordsByAlphagram.get(alphagram);
        
        if (words) {
          words.forEach(word => validWords.add(word));
        }
      });
    }
  }

  /**
   * Encuentra palabras con comodines - versión optimizada
   */
  private findWordsWithWildcards(regularTiles: string[], wildcardCount: number, validWords: Set<string>): void {
    console.log(`🎯 Buscando con ${wildcardCount} comodín(es) y fichas: [${regularTiles.join(', ')}]`);
    
    // Para cada longitud posible
    for (let wordLength = Math.min(regularTiles.length + wildcardCount, 7); wordLength >= 2; wordLength--) {
      // Iterar sobre todos los alfagramas de esa longitud
      for (const [alphagram, words] of this.wordsByAlphagram) {
        if (alphagram.length !== wordLength) continue;
        
        // Verificar si podemos formar este alfagrama con nuestras fichas + comodines
        if (this.canFormWithWildcards(alphagram, regularTiles, wildcardCount)) {
          words.forEach(word => validWords.add(word));
        }
      }
    }
  }

  /**
   * Verifica si un alfagrama se puede formar con las fichas disponibles y comodines
   */
  private canFormWithWildcards(alphagram: string, availableTiles: string[], wildcardCount: number): boolean {
    const alphagramLetters = alphagram.split('');
    const tilesCopy = [...availableTiles];
    let wildcardsNeeded = 0;
    
    for (const letter of alphagramLetters) {
      const tileIndex = tilesCopy.indexOf(letter);
      
      if (tileIndex >= 0) {
        tilesCopy.splice(tileIndex, 1);
      } else {
        wildcardsNeeded++;
        if (wildcardsNeeded > wildcardCount) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Genera combinaciones de tiles
   */
  private generateCombinations(
    tiles: string[], 
    length: number, 
    current: string[], 
    callback: (combination: string[]) => void,
    usedIndices: Set<number> = new Set()
  ): void {
    if (current.length === length) {
      callback([...current]);
      return;
    }
    
    for (let i = 0; i < tiles.length; i++) {
      if (!usedIndices.has(i)) {
        usedIndices.add(i);
        current.push(tiles[i]);
        this.generateCombinations(tiles, length, current, callback, usedIndices);
        current.pop();
        usedIndices.delete(i);
      }
    }
  }

  /**
   * Genera todas las posibles sustituciones de comodines
   */
  private generateWildcardSubstitutions(
    letters: string[],
    count: number,
    current: string[],
    callback: (substitution: string[]) => void
  ): void {
    if (current.length === count) {
      callback([...current]);
      return;
    }
    
    for (const letter of letters) {
      current.push(letter);
      this.generateWildcardSubstitutions(letters, count, current, callback);
      current.pop();
    }
  }

  /**
   * Determina qué fichas del rack se usan para formar una palabra
   * Maneja comodines correctamente y mapea qué letra representa cada comodín
   */
  private getTilesUsedForWord(word: string, rack: string[]): Array<{tile: string, representsLetter?: string}> | null {
    const wordLetters = word.split('');
    const rackCopy = [...rack];
    const tilesUsed: Array<{tile: string, representsLetter?: string}> = [];
    
    for (const letter of wordLetters) {
      const tileIndex = rackCopy.indexOf(letter);
      
      if (tileIndex >= 0) {
        // Usar la ficha normal
        tilesUsed.push({tile: letter});
        rackCopy.splice(tileIndex, 1);
      } else {
        // Intentar usar un comodín
        const wildcardIndex = rackCopy.indexOf('?');
        if (wildcardIndex >= 0) {
          tilesUsed.push({tile: '?', representsLetter: letter}); // Comodín representa esta letra
          rackCopy.splice(wildcardIndex, 1);
        } else {
          // No se puede formar la palabra con este rack
          return null;
        }
      }
    }
    
    return tilesUsed;
  }

  /**
   * Carga las palabras válidas desde el CSV
   */
  private async loadValidWords(): Promise<void> {
    try {
      console.log('📚 Cargando palabras válidas desde lexicon_keys.csv...');
      
      const response = await fetch('/csvs/lexicon_keys.csv');
      let csvText = await response.text();
      
      // Eliminar BOM si existe
      if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.substring(1);
      }
      
      const lines = csvText.split('\n');
      
      // Procesar CSV (asumiendo que la primera línea es el header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        let word = columns[0]?.trim().toUpperCase(); // non_diac_word
        
        if (word && word.length >= 2 && word.length <= 15) {
          // Normalizar dígrafos del CSV al formato del juego
          // En el CSV: ch, ll, rr (letras separadas)
          // En el juego: Ç, K, W (caracteres únicos)
          word = word.replace(/CH/g, 'Ç')
                     .replace(/LL/g, 'K')
                     .replace(/RR/g, 'W');
          
          this.validWords.add(word);
          
          // Generar alfagrama y agregarlo al índice
          const alphagram = this.generateAlphagram(word);
          if (!this.wordsByAlphagram.has(alphagram)) {
            this.wordsByAlphagram.set(alphagram, []);
          }
          this.wordsByAlphagram.get(alphagram)!.push(word);
          
          // Agregar al Trie
          this.addToTrie(word);
        }
      }
      
      console.log(`✅ Cargadas ${this.validWords.size} palabras válidas`);
      console.log(`📊 Creados ${this.wordsByAlphagram.size} alfagramas únicos`);
      
      // Mostrar algunas palabras de ejemplo para verificar
      const sampleWords = Array.from(this.validWords).slice(0, 10);
      console.log(`📝 Palabras de ejemplo: ${sampleWords.join(', ')}`);
      
      // Mostrar algunos alfagramas de ejemplo
      let count = 0;
      for (const [alphagram, words] of this.wordsByAlphagram) {
        if (words.length > 1 && count < 5) {
          console.log(`📝 Alfagrama ${alphagram}: ${words.join(', ')}`);
          count++;
        }
      }
      
      this.isLoaded = true;
      
    } catch (error) {
      console.error('❌ Error cargando palabras:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Espera a que se carguen las palabras
   */
  private async waitForLoad(): Promise<void> {
    const maxWait = 10000; // 10 segundos
    const start = Date.now();
    
    while (!this.isLoaded && (Date.now() - start) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isLoaded) {
      throw new Error('No se pudieron cargar las palabras válidas');
    }
  }

  /**
   * Convierte el atril a mayúsculas (los dígrafos ya vienen como Ç, K, W)
   */
  private normalizeRack(rack: string[]): string[] {
    // Los dígrafos ya vienen normalizados del generador de fichas:
    // CH -> Ç
    // LL -> K  
    // RR -> W
    return rack.map(tile => tile.toUpperCase());
  }

  /**
   * Genera TODOS los movimientos posibles con límite de tiempo
   */
  public async generateAllMoves(
    rack: string[],
    board: BoardCell[][],
    maxMoves: number = 100,
    timeLimit: number = 5000 // 5 segundos por defecto
  ): Promise<ScrabbleMove[]> {
    if (!this.isLoaded) {
      await this.waitForLoad();
    }

    console.log(`🎮 Generando movimientos para atril: [${rack.join(', ')}]`);
    
    const normalizedRack = this.normalizeRack(rack);
    console.log(`📝 Atril normalizado: [${normalizedRack.join(', ')}]`);
    
    const moves: ScrabbleMove[] = [];
    const startTime = Date.now();
    
    // Resetear contadores
    this.bestScoreSoFar = 0;
    this.movesEvaluated = 0;
    this.movesPruned = 0;
    
    // Generar candidatos primero (rápido con alfagramas)
    const candidateWords = this.findValidWordsFromRack(normalizedRack);
    console.log(`📋 ${candidateWords.length} palabras candidatas encontradas`);
    
    if (this.isBoardEmpty(board)) {
      // Tablero vacío: primera jugada
      await this.generateFirstMovesOptimized(normalizedRack, board, moves, candidateWords, startTime, timeLimit);
    } else {
      // Tablero con fichas: jugadas subsecuentes
      await this.generateSubsequentMovesOptimized(normalizedRack, board, moves, candidateWords, startTime, timeLimit);
    }
    
    // Ordenar por puntuación (mayor a menor)
    moves.sort((a, b) => b.score - a.score);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Generados ${moves.length} movimientos válidos en ${elapsed}ms`);
    console.log(`📊 Movimientos evaluados: ${this.movesEvaluated}, podados: ${this.movesPruned}`);
    
    // Mostrar los mejores movimientos
    if (moves.length > 0) {
      console.log('🏆 Top 5 movimientos:');
      moves.slice(0, 5).forEach((move, i) => {
        console.log(`  ${i + 1}. ${move.word} (${move.score} pts) en ${this.formatPosition(move)}`);
      });
    }
    
    return moves.slice(0, maxMoves);
  }

  /**
   * Verifica si el tablero está vacío
   */
  private isBoardEmpty(board: BoardCell[][]): boolean {
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col].tile) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Genera movimientos optimizados para el primer turno
   */
  private async generateFirstMovesOptimized(
    rack: string[],
    board: BoardCell[][],
    moves: ScrabbleMove[],
    candidateWords: string[],
    startTime: number,
    timeLimit: number
  ): Promise<void> {
    console.log('🎯 Generando movimientos para tablero vacío (optimizado)...');
    
    const CENTER = 7;
    
    // Ordenar candidatos por longitud (bingos primero)
    candidateWords.sort((a, b) => b.length - a.length);
    
    for (const word of candidateWords) {
      // Verificar límite de tiempo
      if (Date.now() - startTime > timeLimit) {
        console.log('⏱️ Límite de tiempo alcanzado');
        break;
      }
      
      const tilesUsed = this.getTilesUsedForWord(word, rack);
      if (!tilesUsed) continue;
      
      // Probar posiciones horizontales
      for (let startCol = Math.max(0, CENTER - word.length + 1); startCol <= Math.min(CENTER, 15 - word.length); startCol++) {
        this.movesEvaluated++;
        
        const move = this.createMove(
          word, CENTER, startCol, 'horizontal', 
          board, tilesUsed
        );
        
        if (move && move.score > 0) {
          moves.push(move);
          this.bestScoreSoFar = Math.max(this.bestScoreSoFar, move.score);
        }
      }
      
      // Probar posiciones verticales
      for (let startRow = Math.max(0, CENTER - word.length + 1); startRow <= Math.min(CENTER, 15 - word.length); startRow++) {
        this.movesEvaluated++;
        
        const move = this.createMove(
          word, startRow, CENTER, 'vertical',
          board, tilesUsed
        );
        
        if (move && move.score > 0) {
          moves.push(move);
          this.bestScoreSoFar = Math.max(this.bestScoreSoFar, move.score);
        }
      }
    }
  }

  /**
   * Genera movimientos para el primer turno (tablero vacío)
   */
  private async generateFirstMoves(
    rack: string[],
    board: BoardCell[][],
    moves: ScrabbleMove[]
  ): Promise<void> {
    console.log('🎯 Generando movimientos para tablero vacío...');
    
    // Para el primer movimiento, debe pasar por el centro (7,7)
    const CENTER = 7;
    
    // Usar el nuevo método eficiente con alfagramas
    const validWords = this.findValidWordsFromRack(rack);
    
    console.log(`📊 Procesando ${validWords.length} palabras válidas para el tablero vacío`);
    
    let movesGenerated = 0;
    let bingosFound = 0;
    
    for (const word of validWords) {
      // Contar bingos
      if (word.length === 7) {
        bingosFound++;
        console.log(`🎯 BINGO encontrado #${bingosFound}: ${word}`);
      }
      
      // Determinar qué fichas del rack se usan y si hay comodines
      const tilesUsed = this.getTilesUsedForWord(word, rack);
      
      if (!tilesUsed) continue; // No se puede formar con el rack actual
      
      // Probar todas las posiciones horizontales que cruzan el centro
      for (let startCol = 0; startCol <= CENTER; startCol++) {
        const endCol = startCol + word.length - 1;
        
        if (endCol >= CENTER && endCol < 15) {
          const move = this.createMove(
            word, CENTER, startCol, 'horizontal', 
            board, tilesUsed
          );
          
          if (move) {
            moves.push(move);
            movesGenerated++;
            
            // Log los primeros movimientos generados
            if (movesGenerated <= 3) {
              console.log(`🎯 Movimiento generado: ${word} en H${startCol + 1}→ (${move.score} pts)`);
            }
          }
        }
      }
      
      // Probar todas las posiciones verticales que cruzan el centro
      for (let startRow = 0; startRow <= CENTER; startRow++) {
        const endRow = startRow + word.length - 1;
        
        if (endRow >= CENTER && endRow < 15) {
          const move = this.createMove(
            word, startRow, CENTER, 'vertical',
            board, tilesUsed
          );
          
          if (move) {
            moves.push(move);
            movesGenerated++;
          }
        }
      }
    }
    
    console.log(`📊 Resumen: ${validWords.length} palabras válidas encontradas (${bingosFound} bingos), ${movesGenerated} movimientos generados`);
  }

  /**
   * Genera movimientos con comodines
   */
  private async generateMovesWithWildcards(
    rack: string[],
    board: BoardCell[][],
    moves: ScrabbleMove[],
    CENTER: number
  ): Promise<void> {
    console.log('🎭 Generando movimientos con comodines...');
    
    // Letras del alfabeto español para reemplazar comodines
    // Incluye los dígrafos como caracteres únicos: Ç (CH), K (LL), W (RR)
    const spanishLetters = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                           'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    // Generar todas las posibles sustituciones de comodines
    const wildcardPositions: number[] = [];
    for (let i = 0; i < rack.length; i++) {
      if (rack[i] === '?') {
        wildcardPositions.push(i);
      }
    }
    
    console.log(`🎯 Posiciones de comodines: ${wildcardPositions.join(', ')}`);
    
    // Generar combinaciones con diferentes letras para cada comodín
    const generateSubstitutions = (rackCopy: string[], wildcardIndex: number): void => {
      if (wildcardIndex >= wildcardPositions.length) {
        // Todos los comodines han sido sustituidos, generar movimientos
        const combinations = this.generateAllCombinations(rackCopy);
        
        for (const combo of combinations) {
          const word = combo.join('');
          
          if (this.isValidWord(word)) {
            // Determinar qué fichas son comodines
            const tilesWithWildcards = combo.map((tile, index) => {
              const originalIndex = rack.indexOf(tile, index);
              return {
                letter: tile,
                isWildcard: wildcardPositions.includes(originalIndex)
              };
            });
            
            // Generar movimientos horizontales
            for (let startCol = 0; startCol <= CENTER; startCol++) {
              const endCol = startCol + word.length - 1;
              
              if (endCol >= CENTER && endCol < 15) {
                const move = this.createMoveWithWildcards(
                  word, CENTER, startCol, 'horizontal', 
                  board, tilesWithWildcards
                );
                
                if (move) {
                  moves.push(move);
                }
              }
            }
            
            // Generar movimientos verticales
            for (let startRow = 0; startRow <= CENTER; startRow++) {
              const endRow = startRow + word.length - 1;
              
              if (endRow >= CENTER && endRow < 15) {
                const move = this.createMoveWithWildcards(
                  word, startRow, CENTER, 'vertical',
                  board, tilesWithWildcards
                );
                
                if (move) {
                  moves.push(move);
                }
              }
            }
          }
        }
      } else {
        // Sustituir el comodín actual con cada letra posible
        const pos = wildcardPositions[wildcardIndex];
        
        for (const letter of spanishLetters) {
          const newRack = [...rackCopy];
          newRack[pos] = letter;
          generateSubstitutions(newRack, wildcardIndex + 1);
          
          // Limitar para evitar explosión combinatoria
          if (moves.length > 1000) return;
        }
      }
    };
    
    generateSubstitutions([...rack], 0);
    
    console.log(`📊 Generados ${moves.length} movimientos con comodines`);
  }

  /**
   * Genera movimientos usando el Trie (ULTRA RÁPIDO)
   */
  private generateMovesWithTrie(
    rack: string[],
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
    moves: ScrabbleMove[]
  ): void {
    // Convertir rack a un multiset para búsqueda rápida
    const rackMultiset = new Map<string, number>();
    for (const tile of rack) {
      rackMultiset.set(tile, (rackMultiset.get(tile) || 0) + 1);
    }
    
    // Generar palabras desde esta posición usando el Trie
    this.extendFromPosition(
      board,
      row,
      col,
      direction,
      '',
      this.trie,
      rackMultiset,
      [],
      moves,
      false
    );
  }

  /**
   * Extiende recursivamente desde una posición usando el Trie
   */
  private extendFromPosition(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
    currentWord: string,
    node: TrieNode,
    rackMultiset: Map<string, number>,
    tilesUsed: string[],
    moves: ScrabbleMove[],
    hasPlacedTile: boolean
  ): void {
    // Verificar límites
    if (row >= 15 || col >= 15) return;
    
    // Si es palabra válida y hemos colocado al menos una ficha
    if (node.isEndOfWord && hasPlacedTile && currentWord.length >= 2) {
      // IMPORTANTE: Verificar que no hay más letras después que formen una palabra inválida
      const nextRow = direction === 'horizontal' ? row : row + 1;
      const nextCol = direction === 'horizontal' ? col + 1 : col;
      
      let canPlaceHere = true;
      
      // Si hay una letra después, la palabra debe poder continuar
      if (nextRow < 15 && nextCol < 15 && board[nextRow][nextCol].tile) {
        const nextTile = board[nextRow][nextCol].tile!;
        // Si no hay continuación válida en el Trie, no podemos colocar esta palabra aquí
        if (!node.children.has(nextTile)) {
          canPlaceHere = false;
        }
      }
      
      if (canPlaceHere) {
        // Verificar que conecta con el tablero
        const startRow = direction === 'horizontal' ? row - currentWord.length + 1 : row - currentWord.length + 1;
        const startCol = direction === 'horizontal' ? col - currentWord.length + 1 : col;
        
        if (this.wordConnectsWithBoard(board, startRow, startCol, direction, currentWord)) {
          const move = this.createMove(
            currentWord,
            startRow,
            startCol,
            direction,
            board,
            tilesUsed
          );
          
          if (move && move.score > 0) {
            moves.push(move);
            this.bestScoreSoFar = Math.max(this.bestScoreSoFar, move.score);
          }
        }
      }
    }
    
    // Si hay una ficha en el tablero, debemos usarla
    if (board[row][col].tile) {
      const boardTile = board[row][col].tile!;
      if (node.children.has(boardTile)) {
        const nextRow = direction === 'horizontal' ? row : row + 1;
        const nextCol = direction === 'horizontal' ? col + 1 : col;
        
        this.extendFromPosition(
          board,
          nextRow,
          nextCol,
          direction,
          currentWord + boardTile,
          node.children.get(boardTile)!,
          rackMultiset,
          tilesUsed,
          moves,
          hasPlacedTile
        );
      }
    } else {
      // Probar cada letra que podemos formar con el rack
      for (const [tile, count] of rackMultiset) {
        if (count > 0 && node.children.has(tile)) {
          // Verificar que forma palabras cruzadas válidas
          if (this.canPlaceTile(board, row, col, tile, direction)) {
            // Usar la ficha
            rackMultiset.set(tile, count - 1);
            const newTilesUsed = [...tilesUsed, tile];
            
            const nextRow = direction === 'horizontal' ? row : row + 1;
            const nextCol = direction === 'horizontal' ? col + 1 : col;
            
            this.extendFromPosition(
              board,
              nextRow,
              nextCol,
              direction,
              currentWord + tile,
              node.children.get(tile)!,
              rackMultiset,
              newTilesUsed,
              moves,
              true
            );
            
            // Devolver la ficha
            rackMultiset.set(tile, count);
          }
        }
      }
      
      // También probar comodines
      const wildcardCount = rackMultiset.get('?') || 0;
      if (wildcardCount > 0) {
        // Probar cada letra posible con el comodín
        for (const [letter, childNode] of node.children) {
          if (letter !== '?' && this.canPlaceTile(board, row, col, letter, direction)) {
            rackMultiset.set('?', wildcardCount - 1);
            const newTilesUsed = [...tilesUsed, '?'];
            
            const nextRow = direction === 'horizontal' ? row : row + 1;
            const nextCol = direction === 'horizontal' ? col + 1 : col;
            
            this.extendFromPosition(
              board,
              nextRow,
              nextCol,
              direction,
              currentWord + letter,
              childNode,
              rackMultiset,
              newTilesUsed,
              moves,
              true
            );
            
            rackMultiset.set('?', wildcardCount);
          }
        }
      }
    }
  }

  /**
   * Genera movimientos optimizados para turnos subsecuentes
   */
  private async generateSubsequentMovesOptimized(
    rack: string[],
    board: BoardCell[][],
    moves: ScrabbleMove[],
    candidateWords: string[],
    startTime: number,
    timeLimit: number
  ): Promise<void> {
    console.log('🎯 Generando movimientos para tablero con fichas (optimizado)...');
    
    console.log('🚀 Usando búsqueda con Trie (ULTRA EFICIENTE)');
    
    // Encontrar todas las posiciones ancla
    const anchors = this.findAnchors(board);
    console.log(`📍 ${anchors.length} posiciones ancla encontradas`);
    
    // Para cada ancla, generar movimientos con el Trie
    for (const anchor of anchors) {
      if (Date.now() - startTime > timeLimit) {
        console.log('⏱️ Límite de tiempo alcanzado');
        break;
      }
      
      // Generar movimientos horizontales
      this.generateMovesWithTrie(rack, board, anchor.row, anchor.col, 'horizontal', moves);
      
      // Generar movimientos verticales
      this.generateMovesWithTrie(rack, board, anchor.row, anchor.col, 'vertical', moves);
      
      // También generar desde posiciones antes del ancla
      for (let i = 1; i <= 6 && anchor.col - i >= 0; i++) {
        if (!board[anchor.row][anchor.col - i].tile) {
          this.generateMovesWithTrie(rack, board, anchor.row, anchor.col - i, 'horizontal', moves);
        } else {
          break; // Hay una ficha, no podemos empezar más atrás
        }
      }
      
      for (let i = 1; i <= 6 && anchor.row - i >= 0; i++) {
        if (!board[anchor.row - i][anchor.col].tile) {
          this.generateMovesWithTrie(rack, board, anchor.row - i, anchor.col, 'vertical', moves);
        } else {
          break;
        }
      }
    }
  }

  /**
   * Busca movimientos que usan fichas específicas del tablero
   */
  private findMovesUsingBoardTiles(
    rack: string[],
    board: BoardCell[][],
    candidateWords: string[],
    moves: ScrabbleMove[],
    startTime: number,
    timeLimit: number
  ): void {
    // Para cada ficha en el tablero
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col].tile) {
          const boardTile = board[row][col].tile;
          
          // Verificar qué palabras candidatas contienen esta letra
          for (const word of candidateWords) {
            if (Date.now() - startTime > timeLimit) return;
            
            const positions = this.findLetterPositions(word, boardTile);
            
            for (const pos of positions) {
              // Probar horizontal
              const hStartCol = col - pos;
              if (hStartCol >= 0 && hStartCol + word.length <= 15) {
                this.tryPlaceWord(word, rack, board, row, hStartCol, 'horizontal', moves);
              }
              
              // Probar vertical
              const vStartRow = row - pos;
              if (vStartRow >= 0 && vStartRow + word.length <= 15) {
                this.tryPlaceWord(word, rack, board, vStartRow, col, 'vertical', moves);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Encuentra todas las posiciones de una letra en una palabra
   */
  private findLetterPositions(word: string, letter: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter) {
        positions.push(i);
      }
    }
    return positions;
  }

  /**
   * Encuentra posiciones prometedoras en el tablero
   */
  private findHotSpots(board: BoardCell[][]): Array<{row: number, col: number, direction: 'horizontal' | 'vertical', score: number}> {
    const spots: Array<{row: number, col: number, direction: 'horizontal' | 'vertical', score: number}> = [];
    
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (!board[row][col].tile && this.hasAdjacentTile(board, row, col)) {
          // Evaluar potencial horizontal
          const hScore = this.evaluatePosition(board, row, col, 'horizontal');
          if (hScore > 0) {
            spots.push({ row, col, direction: 'horizontal', score: hScore });
          }
          
          // Evaluar potencial vertical
          const vScore = this.evaluatePosition(board, row, col, 'vertical');
          if (vScore > 0) {
            spots.push({ row, col, direction: 'vertical', score: vScore });
          }
        }
      }
    }
    
    // Ordenar por potencial de puntuación
    return spots.sort((a, b) => b.score - a.score).slice(0, 100); // Top 100 spots
  }

  /**
   * Evalúa el potencial de una posición
   */
  private evaluatePosition(board: BoardCell[][], row: number, col: number, direction: 'horizontal' | 'vertical'): number {
    let score = 0;
    const multiplier = this.BOARD_MULTIPLIERS[row][col];
    
    // Bonus por multiplicadores
    switch (multiplier) {
      case 'TW': score += 30; break;
      case 'DW': case '*': score += 20; break;
      case 'TL': score += 15; break;
      case 'DL': score += 10; break;
    }
    
    // Bonus por fichas adyacentes de alto valor
    const adjacentTiles = this.getAdjacentTiles(board, row, col);
    for (const tile of adjacentTiles) {
      score += (this.TILE_VALUES[tile] || 0) * 2;
    }
    
    return score;
  }

  /**
   * Obtiene fichas adyacentes a una posición
   */
  private getAdjacentTiles(board: BoardCell[][], row: number, col: number): string[] {
    const tiles: string[] = [];
    const positions = [[row-1, col], [row+1, col], [row, col-1], [row, col+1]];
    
    for (const [r, c] of positions) {
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c].tile) {
        tiles.push(board[r][c].tile!);
      }
    }
    
    return tiles;
  }

  /**
   * Intenta colocar una palabra en una posición específica
   */
  private tryPlaceWord(
    word: string,
    rack: string[],
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    moves: ScrabbleMove[]
  ): void {
    this.movesEvaluated++;
    
    // Verificar límites
    const endRow = direction === 'horizontal' ? startRow : startRow + word.length - 1;
    const endCol = direction === 'horizontal' ? startCol + word.length - 1 : startCol;
    
    if (endRow >= 15 || endCol >= 15) return;
    
    // IMPORTANTE: Verificar que no hay fichas adyacentes que formen palabras inválidas
    if (!this.checkAdjacentTiles(word, board, startRow, startCol, direction)) return;
    
    // Verificar que se puede colocar
    if (!this.canPlaceWord(word, board, startRow, startCol, direction, rack)) return;
    
    // Crear el movimiento
    const tilesUsed = this.getTilesUsedForWord(word, rack);
    if (!tilesUsed) return;
    
    const move = this.createMove(word, startRow, startCol, direction, board, tilesUsed);
    
    if (move && move.score > 0) {
      // Verificar conexión con el tablero
      if (this.wordConnectsWithBoard(board, startRow, startCol, direction, word)) {
        moves.push(move);
        this.bestScoreSoFar = Math.max(this.bestScoreSoFar, move.score);
      }
    }
  }

  /**
   * Verifica que no hay fichas adyacentes que formen palabras inválidas
   */
  private checkAdjacentTiles(
    word: string,
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical'
  ): boolean {
    // Verificar antes del inicio
    if (direction === 'horizontal') {
      if (startCol > 0 && board[startRow][startCol - 1].tile) {
        return false; // Hay una ficha justo antes
      }
      if (startCol + word.length < 15 && board[startRow][startCol + word.length].tile) {
        return false; // Hay una ficha justo después
      }
    } else {
      if (startRow > 0 && board[startRow - 1][startCol].tile) {
        return false; // Hay una ficha justo arriba
      }
      if (startRow + word.length < 15 && board[startRow + word.length][startCol].tile) {
        return false; // Hay una ficha justo abajo
      }
    }
    
    return true;
  }

  /**
   * Verifica si se puede colocar una palabra con el rack disponible
   */
  private canPlaceWord(
    word: string,
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    rack: string[]
  ): boolean {
    const rackCopy = [...rack];
    let usesAtLeastOneFromRack = false;
    
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (row >= 15 || col >= 15) return false;
      
      if (board[row][col].tile) {
        // Debe coincidir con la ficha existente
        if (board[row][col].tile !== word[i]) return false;
      } else {
        // Necesitamos esta ficha del rack
        const tileIndex = rackCopy.indexOf(word[i]);
        if (tileIndex >= 0) {
          rackCopy.splice(tileIndex, 1);
          usesAtLeastOneFromRack = true;
        } else {
          // Intentar con comodín
          const wildcardIndex = rackCopy.indexOf('?');
          if (wildcardIndex >= 0) {
            rackCopy.splice(wildcardIndex, 1);
            usesAtLeastOneFromRack = true;
          } else {
            return false;
          }
        }
      }
    }
    
    return usesAtLeastOneFromRack; // Debe usar al menos una ficha del rack
  }

  /**
   * Genera movimientos para turnos subsecuentes
   */
  private async generateSubsequentMoves(
    rack: string[],
    board: BoardCell[][],
    moves: ScrabbleMove[]
  ): Promise<void> {
    console.log('🎯 Generando movimientos para tablero con fichas...');
    
    // Encontrar todas las casillas ancla
    const anchors = this.findAnchors(board);
    console.log(`📍 Encontradas ${anchors.length} casillas ancla`);
    
    // Debug: Mostrar algunas anclas
    console.log(`📍 Primeras 10 anclas:`, anchors.slice(0, 10).map(a => `(${a.row},${a.col})`));
    
    // Debug específico para fila 10 (índice 9)
    const row10Anchors = anchors.filter(a => a.row === 9);
    console.log(`🔍 Anclas en fila 10:`, row10Anchors.map(a => `(${a.row},${a.col})`));
    
    // Verificar si hay J en 10D (9,3)
    if (board[9] && board[9][3] && board[9][3].tile === 'J') {
      console.log(`✅ Confirmado: J está en 10D (9,3)`);
    }
    
    // Para cada ancla, generar movimientos posibles
    for (const anchor of anchors) {
      // Generar movimientos horizontales
      this.generateMovesFromAnchor(
        rack, board, anchor.row, anchor.col, 'horizontal', moves
      );
      
      // Generar movimientos verticales
      this.generateMovesFromAnchor(
        rack, board, anchor.row, anchor.col, 'vertical', moves
      );
    }
    
    // Debug: Log si encontramos palabras con Ç
    const wordsWithCH = moves.filter(m => m.word.includes('Ç'));
    if (wordsWithCH.length > 0) {
      console.log(`🔍 Palabras con Ç encontradas:`, wordsWithCH.map(m => `${m.word} (${m.score}pts)`));
    }
  }

  /**
   * Encuentra todas las casillas ancla (adyacentes a fichas existentes)
   */
  private findAnchors(board: BoardCell[][]): Array<{row: number, col: number}> {
    const anchors: Array<{row: number, col: number}> = [];
    const seen = new Set<string>();
    
    // Primero, encontrar todas las casillas vacías adyacentes a fichas
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (!board[row][col].tile && this.hasAdjacentTile(board, row, col)) {
          const key = `${row},${col}`;
          if (!seen.has(key)) {
            anchors.push({row, col});
            seen.add(key);
          }
        }
      }
    }
    
    // También incluir todas las casillas vacías en líneas que contengan fichas
    for (let row = 0; row < 15; row++) {
      let hasFilledInRow = false;
      for (let col = 0; col < 15; col++) {
        if (board[row][col].tile) {
          hasFilledInRow = true;
          break;
        }
      }
      
      if (hasFilledInRow) {
        for (let col = 0; col < 15; col++) {
          if (!board[row][col].tile) {
            const key = `${row},${col}`;
            if (!seen.has(key)) {
              anchors.push({row, col});
              seen.add(key);
            }
          }
        }
      }
    }
    
    // También para columnas
    for (let col = 0; col < 15; col++) {
      let hasFilledInCol = false;
      for (let row = 0; row < 15; row++) {
        if (board[row][col].tile) {
          hasFilledInCol = true;
          break;
        }
      }
      
      if (hasFilledInCol) {
        for (let row = 0; row < 15; row++) {
          if (!board[row][col].tile) {
            const key = `${row},${col}`;
            if (!seen.has(key)) {
              anchors.push({row, col});
              seen.add(key);
            }
          }
        }
      }
    }
    
    return anchors;
  }

  /**
   * Verifica si una casilla tiene fichas adyacentes
   */
  private hasAdjacentTile(board: BoardCell[][], row: number, col: number): boolean {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
        if (board[newRow][newCol].tile) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Genera movimientos desde una casilla ancla específica
   */
  private generateMovesFromAnchor(
    rack: string[],
    board: BoardCell[][],
    anchorRow: number,
    anchorCol: number,
    direction: 'horizontal' | 'vertical',
    moves: ScrabbleMove[]
  ): void {
    // Debug para cualquier ancla en fila 10
    if (anchorRow === 9) {
      const colLabel = String.fromCharCode(65 + anchorCol); // A, B, C, etc.
      console.log(`🎯 Procesando ancla 10${colLabel} (${anchorRow},${anchorCol}) en dirección ${direction}`);
      if (anchorCol <= 3) { // Solo para las primeras columnas donde podría estar ÇEJE
        console.log(`🎯 Rack disponible: [${rack.join(', ')}]`);
        
        // Verificar específicamente si podemos formar ÇEJE desde 10A
        if (direction === 'horizontal' && anchorCol === 0) {
          console.log(`🔍 Verificando si ÇEJE es posible desde 10A:`);
          console.log(`  - Rack tiene Ç: ${rack.includes('Ç')}`);
          console.log(`  - Rack tiene E: ${rack.filter(t => t === 'E').length} veces`);
          console.log(`  - J en 10D (9,3): ${board[9][3]?.tile === 'J' ? 'SÍ' : 'NO'}`);
        }
      }
    }
    
    // Para cada posible longitud de palabra hacia la izquierda/arriba del ancla
    const maxPrefix = Math.min(6, direction === 'horizontal' ? anchorCol : anchorRow);
    
    // IMPORTANTE: También probar palabras que empiecen EN el ancla (prefixLength = 0)
    for (let prefixLength = 0; prefixLength <= maxPrefix; prefixLength++) {
      const startRow = direction === 'horizontal' ? anchorRow : anchorRow - prefixLength;
      const startCol = direction === 'horizontal' ? anchorCol - prefixLength : anchorCol;
      
      // Debug específico para ÇEJE en fila 10
      if (anchorRow === 9 && direction === 'horizontal') {
        if (startCol === 0) {
          console.log(`🎯 Probando palabra desde 10A (9,0)`);
        } else if (startCol === 1 && board[9][3]?.tile === 'J') {
          console.log(`🎯 Probando palabra desde 10B (9,1) - J está en 10D, podría formar ÇEJE`);
          console.log(`  - Necesito: Ç, E, E del rack`);
          console.log(`  - Tengo en rack: [${rack.join(', ')}]`);
        }
      }
      
      // Verificar que no haya fichas bloqueando antes del inicio
      let blocked = false;
      if (prefixLength > 0) {
        const checkRow = direction === 'horizontal' ? startRow : startRow - 1;
        const checkCol = direction === 'horizontal' ? startCol - 1 : startCol;
        
        if (checkRow >= 0 && checkCol >= 0 && board[checkRow][checkCol].tile) {
          blocked = true;
        }
      }
      
      if (!blocked && startRow >= 0 && startCol >= 0) {
        // Obtener el prefijo existente
        const prefix = this.getPrefixFrom(board, startRow, startCol, anchorRow, anchorCol, direction);
        
        // Debug para 10B
        if (anchorRow === 9 && anchorCol === 1 && direction === 'vertical') {
          console.log(`🎯 10B: Intentando desde (${startRow},${startCol}) con prefijo: "${prefix}"`);
        }
        
        // Verificar si hay comodines
        const wildcardCount = rack.filter(tile => tile === '?').length;
        
        if (wildcardCount > 0) {
          this.extendWordWithWildcards(
            rack, board, startRow, startCol, direction, prefix, [], moves, []
          );
        } else {
          this.extendWord(
            rack, board, startRow, startCol, direction, prefix, [], moves
          );
        }
      }
    }
  }

  /**
   * Obtiene el prefijo desde una posición específica hasta el ancla
   */
  private getPrefixFrom(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    anchorRow: number,
    anchorCol: number,
    direction: 'horizontal' | 'vertical'
  ): string {
    let prefix = '';
    let currentRow = startRow;
    let currentCol = startCol;
    
    // Construir el prefijo desde el inicio hasta antes del ancla
    while ((direction === 'horizontal' && currentCol < anchorCol) ||
           (direction === 'vertical' && currentRow < anchorRow)) {
      if (board[currentRow][currentCol].tile) {
        prefix += board[currentRow][currentCol].tile;
      } else {
        // Si encontramos un espacio vacío antes del ancla, no es un prefijo válido
        return '';
      }
      
      if (direction === 'horizontal') {
        currentCol++;
      } else {
        currentRow++;
      }
    }
    
    return prefix;
  }

  /**
   * Obtiene el prefijo de fichas ya colocadas antes de una posición
   */
  private getPrefix(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical'
  ): string {
    let prefix = '';
    let currentRow = row;
    let currentCol = col;
    
    // Retroceder hasta encontrar el inicio de la palabra
    while (true) {
      if (direction === 'horizontal') {
        currentCol--;
        if (currentCol < 0 || !board[currentRow][currentCol].tile) break;
      } else {
        currentRow--;
        if (currentRow < 0 || !board[currentRow][currentCol].tile) break;
      }
    }
    
    // Avanzar construyendo el prefijo
    if (direction === 'horizontal') {
      currentCol++;
      while (currentCol < col && board[row][currentCol].tile) {
        prefix += board[row][currentCol].tile;
        currentCol++;
      }
    } else {
      currentRow++;
      while (currentRow < row && board[currentRow][col].tile) {
        prefix += board[currentRow][col].tile;
        currentRow++;
      }
    }
    
    return prefix;
  }

  /**
   * Extiende una palabra recursivamente con comodines
   */
  private extendWordWithWildcards(
    availableRack: string[],
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    currentWord: string,
    usedTiles: string[],
    moves: ScrabbleMove[],
    wildcardUsed: boolean[]
  ): void {
    // Verificar si la palabra actual es válida
    if (currentWord.length >= 2) {
      // Para cada posible sustitución de comodines, verificar si es válida
      const wildcardPositions = usedTiles.map((tile, idx) => tile === '?' ? idx : -1).filter(idx => idx >= 0);
      
      if (wildcardPositions.length > 0) {
        // Generar todas las sustituciones posibles
        // Incluye los dígrafos como caracteres únicos: Ç (CH), K (LL), W (RR)
        const spanishLetters = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                               'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        
        const trySubstitutions = (wordArray: string[], wildcardIdx: number): void => {
          if (wildcardIdx >= wildcardPositions.length) {
            const testWord = wordArray.join('');
            if (this.isValidWord(testWord)) {
              // Verificar palabras cruzadas
              const crossWords = this.getCrossWords(board, startRow, startCol, direction, testWord);
              
              if (this.areAllCrossWordsValid(crossWords)) {
                // Verificar que conecta con el tablero
                const connectsWithBoard = this.wordConnectsWithBoard(
                  board, startRow, startCol, direction, testWord
                );
                
                if (!connectsWithBoard) {
                  return; // No generar movimientos que no conectan
                }
                
                const tilesWithWildcards = wordArray.map((letter, idx) => ({
                  letter,
                  isWildcard: wildcardPositions.includes(idx)
                }));
                
                const move = this.createMoveWithWildcards(
                  testWord, startRow, startCol, direction,
                  board, tilesWithWildcards
                );
                
                if (move && move.score > 0) {
                  moves.push(move);
                }
              }
            }
          } else {
            const pos = wildcardPositions[wildcardIdx];
            for (const letter of spanishLetters) {
              const newWordArray = [...wordArray];
              newWordArray[pos] = letter;
              trySubstitutions(newWordArray, wildcardIdx + 1);
            }
          }
        };
        
        trySubstitutions(currentWord.split(''), 0);
      } else {
        // No hay comodines, verificar normalmente
        if (this.isValidWord(currentWord)) {
          const crossWords = this.getCrossWords(board, startRow, startCol, direction, currentWord);
          
          if (this.areAllCrossWordsValid(crossWords)) {
            // Verificar que conecta con el tablero
            const connectsWithBoard = this.wordConnectsWithBoard(
              board, startRow, startCol, direction, currentWord
            );
            
            if (!connectsWithBoard) {
              return; // No generar movimientos que no conectan
            }
            
            const move = this.createMove(
              currentWord, startRow, startCol, direction,
              board, usedTiles, crossWords
            );
            
            if (move && move.score > 0) {
              moves.push(move);
            }
          }
        }
      }
    }
    
    // Continuar extendiendo la palabra
    const currentRow = direction === 'horizontal' ? startRow : startRow + currentWord.length;
    const currentCol = direction === 'horizontal' ? startCol + currentWord.length : startCol;
    
    if (currentRow >= 15 || currentCol >= 15) return;
    
    // Si hay una ficha en el tablero, usarla
    if (board[currentRow][currentCol].tile) {
      const boardTile = board[currentRow][currentCol].tile!;
      this.extendWordWithWildcards(
        availableRack, board, startRow, startCol, direction,
        currentWord + boardTile, usedTiles, moves, wildcardUsed
      );
    } else {
      // Probar cada ficha del atril
      for (let i = 0; i < availableRack.length; i++) {
        const tile = availableRack[i];
        
        if (tile === '?') {
          // Comodín - no verificar cross-check aquí, se hará después
          const newRack = [...availableRack];
          newRack.splice(i, 1);
          
          const newUsedTiles = [...usedTiles, tile];
          const newWildcardUsed = [...wildcardUsed, true];
          
          this.extendWordWithWildcards(
            newRack, board, startRow, startCol, direction,
            currentWord + '?', newUsedTiles, moves, newWildcardUsed
          );
        } else if (this.canPlaceTile(board, currentRow, currentCol, tile, direction)) {
          const newRack = [...availableRack];
          newRack.splice(i, 1);
          
          const newUsedTiles = [...usedTiles, tile];
          const newWildcardUsed = [...wildcardUsed, false];
          
          this.extendWordWithWildcards(
            newRack, board, startRow, startCol, direction,
            currentWord + tile, newUsedTiles, moves, newWildcardUsed
          );
        }
      }
    }
  }

  /**
   * Extiende una palabra recursivamente
   */
  private extendWord(
    availableRack: string[],
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    currentWord: string,
    usedTiles: string[],
    moves: ScrabbleMove[]
  ): void {
    // Debug para fila 10 horizontal
    if (startRow === 9 && direction === 'horizontal' && currentWord.length > 0) {
      if (startCol <= 2) { // Posibles posiciones para ÇEJE
        console.log(`🔍 Fila 10, col ${startCol}: Construyendo "${currentWord}" con tiles usados: [${usedTiles.join(',')}]`);
        
        // Si encuentra una J en el tablero, reportarlo
        const currentPos = startCol + currentWord.length;
        if (currentPos < 15 && board[9][currentPos].tile === 'J') {
          console.log(`  ➡️ Siguiente posición tiene J en el tablero`);
        }
        
        // Debug específico para ÇEJE - verificar dónde está exactamente la J
        if (startCol === 0) {
          console.log(`  🔍 Verificando posiciones desde 10A:`);
          for (let i = 0; i < 4; i++) {
            const tile = board[9][i]?.tile || '-';
            console.log(`    10${String.fromCharCode(65 + i)}: ${tile}`);
          }
          
          // Si J está en 10D (posición 3), entonces ÇEJE no puede empezar en 10A
          // porque sería Ç-E-?-J, no Ç-E-J-E
          if (board[9][3]?.tile === 'J' && currentWord.length === 3 && currentWord.startsWith('ÇE')) {
            console.log(`  ⚠️ J está en 10D, no se puede formar ÇEJE desde 10A`);
          }
        }
        
        // Verificar si podemos formar ÇEJE empezando en 10B (índice 1)
        if (startCol === 1) {
          if (currentWord === 'ÇE' && board[9][3]?.tile === 'J') {
            console.log(`  🎯 POTENCIAL ÇEJE desde 10B: ÇE + J (en tablero en 10D)`);
            console.log(`  🎯 Necesito otra E después de J`);
            console.log(`  🎯 Tiles disponibles: [${availableRack.join(', ')}]`);
          } else if (currentWord === 'ÇEJ') {
            console.log(`  🎯 Construyendo ÇEJE desde 10B: ya tengo ÇEJ`);
            console.log(`  🎯 Siguiente posición (10E) necesita E`);
            console.log(`  🎯 Tiles disponibles: [${availableRack.join(', ')}]`);
          }
        }
      }
    }
    // Verificar si la palabra actual es válida
    if (currentWord.length >= 2 && this.isValidWord(currentWord)) {
      // IMPORTANTE: Verificar que al menos una ficha nueva se colocó
      if (usedTiles.length > 0) {
        // IMPORTANTE: Verificar que la palabra conecta con fichas existentes
        const connectsWithBoard = this.wordConnectsWithBoard(
          board, startRow, startCol, direction, currentWord
        );
        
        if (!connectsWithBoard) {
          return; // No generar movimientos que no conectan
        }
        
        // Verificar que todas las palabras cruzadas sean válidas
        const crossWords = this.getCrossWords(
          board, startRow, startCol, direction, currentWord
        );
        
        if (this.areAllCrossWordsValid(crossWords)) {
          const move = this.createMove(
            currentWord, startRow, startCol, direction,
            board, usedTiles, crossWords
          );
          
          if (move && move.score > 0) {
            moves.push(move);
            
            // Debug para ÇEJE
            if (currentWord === 'ÇEJE' || currentWord === 'CHEJE') {
              const rowLabel = String.fromCharCode(65 + startRow);
              const colLabel = startCol + 1;
              const coordStr = direction === 'vertical' ? `${colLabel}${rowLabel}↓` : `${rowLabel}${colLabel}→`;
              console.log(`🎯 ÇEJE encontrado! Posición: ${coordStr} (${startRow},${startCol}) ${direction}, Score: ${move.score}`);
              console.log(`  - Tiles usados del rack: [${usedTiles.join(', ')}]`);
              console.log(`  - Tiles colocados: ${move.tilesPlaced.map(t => `${t.letter} en (${t.row},${t.col})`).join(', ')}`);
            }
          }
        }
      }
    }
    
    // Calcular la posición actual
    const currentRow = direction === 'horizontal' ? startRow : startRow + currentWord.length;
    const currentCol = direction === 'horizontal' ? startCol + currentWord.length : startCol;
    
    // Verificar límites del tablero
    if (currentRow >= 15 || currentCol >= 15) return;
    
    // Si hay una ficha en la posición actual, debemos usarla
    if (board[currentRow][currentCol].tile) {
      const boardTile = board[currentRow][currentCol].tile!;
      
      // Debug para J en fila 10
      if (currentRow === 9 && boardTile === 'J' && direction === 'horizontal') {
        console.log(`🎯 Encontrada J en tablero en posición (${currentRow},${currentCol}), palabra hasta ahora: "${currentWord}"`);
      }
      
      this.extendWord(
        availableRack, board, startRow, startCol, direction,
        currentWord + boardTile, usedTiles, moves
      );
    } else {
      // Probar cada ficha disponible del atril
      for (let i = 0; i < availableRack.length; i++) {
        const tile = availableRack[i];
        
        // Verificar si esta ficha forma palabras cruzadas válidas
        if (this.canPlaceTile(board, currentRow, currentCol, tile, direction)) {
          const newRack = [...availableRack];
          newRack.splice(i, 1);
          
          const newUsedTiles = [...usedTiles, tile];
          
          this.extendWord(
            newRack, board, startRow, startCol, direction,
            currentWord + tile, newUsedTiles, moves
          );
        }
      }
    }
  }

  /**
   * Verifica si se puede colocar una ficha en una posición
   */
  private canPlaceTile(
    board: BoardCell[][],
    row: number,
    col: number,
    tile: string,
    mainDirection: 'horizontal' | 'vertical'
  ): boolean {
    // Obtener la palabra cruzada que se formaría
    const crossDirection = mainDirection === 'horizontal' ? 'vertical' : 'horizontal';
    const crossWord = this.getWordAt(board, row, col, crossDirection, tile);
    
    // Si no forma palabra cruzada o es de longitud 1, es válido
    if (crossWord.length <= 1) return true;
    
    // Verificar si la palabra cruzada es válida
    return this.isValidWord(crossWord);
  }

  /**
   * Obtiene la palabra que se formaría en una posición con una ficha
   */
  private getWordAt(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
    tile: string
  ): string {
    let word = tile;
    let currentRow = row;
    let currentCol = col;
    
    // Ir hacia atrás
    if (direction === 'horizontal') {
      currentCol--;
      while (currentCol >= 0 && board[currentRow][currentCol].tile) {
        word = board[currentRow][currentCol].tile + word;
        currentCol--;
      }
      
      // Ir hacia adelante
      currentCol = col + 1;
      while (currentCol < 15 && board[currentRow][currentCol].tile) {
        word += board[currentRow][currentCol].tile;
        currentCol++;
      }
    } else {
      // Vertical
      currentRow--;
      while (currentRow >= 0 && board[currentRow][currentCol].tile) {
        word = board[currentRow][currentCol].tile + word;
        currentRow--;
      }
      
      // Ir hacia abajo
      currentRow = row + 1;
      while (currentRow < 15 && board[currentRow][currentCol].tile) {
        word += board[currentRow][currentCol].tile;
        currentRow++;
      }
    }
    
    return word;
  }

  /**
   * Obtiene todas las palabras cruzadas formadas por un movimiento
   */
  private getCrossWords(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    word: string
  ): Array<{word: string, row: number, col: number, direction: 'horizontal' | 'vertical'}> {
    const crossWords: Array<{word: string, row: number, col: number, direction: 'horizontal' | 'vertical'}> = [];
    const crossDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
    
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      // Solo verificar si estamos colocando una ficha nueva
      if (!board[row][col].tile) {
        const crossWord = this.getWordAt(board, row, col, crossDirection, word[i]);
        
        if (crossWord.length > 1) {
          // Encontrar el inicio de la palabra cruzada
          let crossStartRow = row;
          let crossStartCol = col;
          
          if (crossDirection === 'horizontal') {
            while (crossStartCol > 0 && board[crossStartRow][crossStartCol - 1].tile) {
              crossStartCol--;
            }
          } else {
            while (crossStartRow > 0 && board[crossStartRow - 1][crossStartCol].tile) {
              crossStartRow--;
            }
          }
          
          crossWords.push({
            word: crossWord,
            row: crossStartRow,
            col: crossStartCol,
            direction: crossDirection
          });
        }
      }
    }
    
    return crossWords;
  }

  /**
   * Verifica si todas las palabras cruzadas son válidas
   */
  private areAllCrossWordsValid(
    crossWords: Array<{word: string, row: number, col: number, direction: 'horizontal' | 'vertical'}>
  ): boolean {
    for (const crossWord of crossWords) {
      if (!this.isValidWord(crossWord.word)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifica si una palabra conecta con al menos una ficha existente en el tablero
   */
  private wordConnectsWithBoard(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    word: string
  ): boolean {
    let usesExistingTile = false;
    let hasAdjacentTile = false;
    
    // IMPORTANTE: Primero verificar que la palabra no entra en conflicto con fichas existentes
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      // Si hay una ficha en esta posición, debe coincidir con la letra de la palabra
      if (board[row][col].tile) {
        if (board[row][col].tile !== word[i]) {
          // Conflicto: la palabra intenta reemplazar una ficha existente
          return false;
        }
        usesExistingTile = true;
      }
      
      // Verificar fichas adyacentes (arriba, abajo, izquierda, derecha)
      const adjacentPositions = [
        [row - 1, col], // arriba
        [row + 1, col], // abajo
        [row, col - 1], // izquierda
        [row, col + 1]  // derecha
      ];
      
      for (const [adjRow, adjCol] of adjacentPositions) {
        if (adjRow >= 0 && adjRow < 15 && adjCol >= 0 && adjCol < 15) {
          // No contar las posiciones que son parte de la palabra misma
          const isPartOfWord = direction === 'horizontal' 
            ? (adjRow === row && adjCol >= startCol && adjCol < startCol + word.length)
            : (adjCol === col && adjRow >= startRow && adjRow < startRow + word.length);
          
          if (!isPartOfWord && board[adjRow][adjCol].tile) {
            hasAdjacentTile = true;
            break;
          }
        }
      }
      
      if (hasAdjacentTile) break;
    }
    
    return usesExistingTile || hasAdjacentTile;
  }

  /**
   * Genera todas las combinaciones posibles de un conjunto de fichas
   */
  private generateAllCombinations(tiles: string[]): string[][] {
    const combinations: string[][] = [];
    const maxCombinations = 50000; // Aumentar límite para asegurar que incluya bingos
    
    // IMPORTANTE: Empezar con las combinaciones más largas (7 letras) para priorizar bingos
    for (let length = Math.min(tiles.length, 7); length >= 2; length--) {
      if (combinations.length >= maxCombinations) break;
      
      const lengthCombinations: string[][] = [];
      // Para bingos (7 letras), permitir más permutaciones
      const maxPermutations = length === 7 ? 20000 : 10000;
      this.generatePermutations(tiles, length, [], lengthCombinations, new Set(), maxPermutations);
      
      console.log(`📝 Longitud ${length}: ${lengthCombinations.length} permutaciones generadas`);
      
      // Si es longitud 7 (bingo), mostrar algunas para debug
      if (length === 7 && lengthCombinations.length > 0) {
        console.log(`🎯 Ejemplos de bingos generados: ${lengthCombinations.slice(0, 5).map(c => c.join('')).join(', ')}`);
      }
      
      // Agregar solo las que no excedan el límite
      const remaining = maxCombinations - combinations.length;
      combinations.push(...lengthCombinations.slice(0, remaining));
    }
    
    console.log(`🎲 Generadas ${combinations.length} combinaciones totales de ${tiles.length} fichas`);
    
    // Contar por longitud para debug
    const lengthCounts: Record<number, number> = {};
    combinations.forEach(combo => {
      lengthCounts[combo.length] = (lengthCounts[combo.length] || 0) + 1;
    });
    console.log(`📊 Distribución por longitud:`, lengthCounts);
    
    return combinations;
  }

  /**
   * Genera permutaciones de una longitud específica
   */
  private generatePermutations(
    tiles: string[],
    length: number,
    current: string[],
    results: string[][],
    usedIndices: Set<number>,
    maxResults: number = 10000
  ): void {
    if (current.length === length) {
      results.push([...current]);
      return;
    }
    
    // Limitar el número de resultados para evitar explosión combinatoria
    if (results.length >= maxResults) return;
    
    for (let i = 0; i < tiles.length; i++) {
      if (!usedIndices.has(i)) {
        usedIndices.add(i);
        current.push(tiles[i]);
        this.generatePermutations(tiles, length, current, results, usedIndices, maxResults);
        current.pop();
        usedIndices.delete(i);
      }
    }
  }

  /**
   * Verifica si una palabra es válida
   */
  private isValidWord(word: string): boolean {
    const upperWord = word.toUpperCase();
    const isValid = this.validWords.has(upperWord);
    
    // Debug para las primeras verificaciones
    if (this.validWords.size > 0 && !this.debugShown) {
      console.log(`🔍 Verificando palabra: "${upperWord}" - ${isValid ? 'VÁLIDA' : 'NO VÁLIDA'}`);
      console.log(`📚 Total palabras en diccionario: ${this.validWords.size}`);
      
      // Mostrar si hay palabras similares
      if (!isValid && upperWord.length >= 2) {
        const similarWords = Array.from(this.validWords)
          .filter(w => w.startsWith(upperWord.substring(0, 2)))
          .slice(0, 5);
        if (similarWords.length > 0) {
          console.log(`💡 Palabras similares: ${similarWords.join(', ')}`);
        }
      }
      
      // Marcar que ya mostramos el debug
      this.debugShown = true;
    }
    
    return isValid;
  }

  /**
   * Crea un movimiento con información de comodines
   */
  private createMoveWithWildcards(
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][],
    tilesWithWildcards: Array<{letter: string, isWildcard: boolean}>
  ): ScrabbleMove | null {
    const tilesPlaced: Array<{row: number, col: number, letter: string, isWildcard: boolean}> = [];
    
    // Identificar qué fichas se colocan
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (!board[row][col].tile) {
        tilesPlaced.push({
          row,
          col,
          letter: word[i],
          isWildcard: tilesWithWildcards[i].isWildcard
        });
      }
    }
    
    // Calcular puntuación
    const score = this.calculateScore(word, startRow, startCol, direction, board, tilesPlaced, []);
    
    return {
      word,
      startRow,
      startCol,
      direction,
      tilesPlaced,
      score,
      crossWords: []
    };
  }

  /**
   * Crea un objeto ScrabbleMove
   */
  private createMove(
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][],
    tilesUsed: Array<{tile: string, representsLetter?: string}> | string[],
    crossWords: Array<{word: string, row: number, col: number, direction: 'horizontal' | 'vertical'}> = []
  ): ScrabbleMove | null {
    const tilesPlaced: Array<{row: number, col: number, letter: string, isWildcard: boolean}> = [];
    let tileIndex = 0;
    
    // Convertir tilesUsed antiguo al nuevo formato si es necesario
    const tilesInfo = typeof tilesUsed[0] === 'string' 
      ? tilesUsed.map(t => ({tile: t as string}))
      : tilesUsed as Array<{tile: string, representsLetter?: string}>;
    
    // Identificar qué fichas se colocan
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (!board[row][col].tile) {
        const tileInfo = tilesInfo[tileIndex];
        tilesPlaced.push({
          row,
          col,
          letter: word[i],
          isWildcard: tileInfo.tile === '?'
        });
        tileIndex++;
      }
    }
    
    // Calcular puntuación
    const score = this.calculateScore(word, startRow, startCol, direction, board, tilesPlaced, crossWords);
    
    return {
      word,
      startRow,
      startCol,
      direction,
      tilesPlaced,
      score,
      crossWords
    };
  }

  /**
   * Calcula la puntuación de un movimiento
   */
  private calculateScore(
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][],
    tilesPlaced: Array<{row: number, col: number, letter: string, isWildcard: boolean}>,
    crossWords: Array<{word: string, row: number, col: number, direction: 'horizontal' | 'vertical'}>
  ): number {
    let score = 0;
    let wordMultiplier = 1;
    
    // Puntuación de la palabra principal
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      const letter = word[i];
      
      let letterValue = this.TILE_VALUES[letter] || 0;
      let letterMultiplier = 1;
      
      // Solo aplicar multiplicadores si es una ficha nueva
      const isNewTile = tilesPlaced.some(t => t.row === row && t.col === col);
      
      // Si la ficha viene del tablero y es un comodín, vale 0
      if (!isNewTile && board[row][col].isWildcard) {
        letterValue = 0;
      }
      
      if (isNewTile) {
        const multiplier = this.BOARD_MULTIPLIERS[row][col];
        
        switch (multiplier) {
          case 'DL':
            letterMultiplier = 2;
            break;
          case 'TL':
            letterMultiplier = 3;
            break;
          case 'DW':
          case '*': // Centro
            wordMultiplier *= 2;
            break;
          case 'TW':
            wordMultiplier *= 3;
            break;
        }
        
        // Los comodines valen 0
        const tile = tilesPlaced.find(t => t.row === row && t.col === col);
        if (tile?.isWildcard) {
          letterValue = 0;
        }
      }
      
      score += letterValue * letterMultiplier;
    }
    
    score *= wordMultiplier;
    
    // Puntuación de las palabras cruzadas
    for (const crossWord of crossWords) {
      let crossScore = 0;
      let crossMultiplier = 1;
      
      for (let i = 0; i < crossWord.word.length; i++) {
        const row = crossWord.direction === 'horizontal' ? crossWord.row : crossWord.row + i;
        const col = crossWord.direction === 'horizontal' ? crossWord.col + i : crossWord.col;
        const letter = crossWord.word[i];
        
        let letterValue = this.TILE_VALUES[letter] || 0;
        
        // Solo aplicar multiplicador de palabra si es la ficha nueva
        const isNewTile = tilesPlaced.some(t => t.row === row && t.col === col);
        
        // Si la ficha viene del tablero y es un comodín, vale 0
        if (!isNewTile && board[row][col].isWildcard) {
          letterValue = 0;
        }
        
        if (isNewTile) {
          const multiplier = this.BOARD_MULTIPLIERS[row][col];
          
          if (multiplier === 'DW' || multiplier === '*') {
            crossMultiplier *= 2;
          } else if (multiplier === 'TW') {
            crossMultiplier *= 3;
          }
          
          // Los comodines valen 0
          const tile = tilesPlaced.find(t => t.row === row && t.col === col);
          if (tile?.isWildcard) {
            letterValue = 0;
          }
        }
        
        crossScore += letterValue;
      }
      
      score += crossScore * crossMultiplier;
    }
    
    // Bonus por usar las 7 fichas
    if (tilesPlaced.length === 7) {
      score += 50;
    }
    
    return score;
  }

  /**
   * Formatea la posición de un movimiento para mostrar
   */
  private formatPosition(move: ScrabbleMove): string {
    const row = String.fromCharCode(65 + move.startRow); // A-O
    const col = move.startCol + 1; // 1-15
    const dir = move.direction === 'horizontal' ? '→' : '↓';
    return `${row}${col}${dir}`;
  }

  /**
   * Verifica si el generador está listo
   */
  public isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Obtiene estadísticas del generador
   */
  public getStats(): any {
    return {
      isLoaded: this.isLoaded,
      validWordsCount: this.validWords.size
    };
  }
}