/**
 * Lector de archivos KWG (formato binario GADDAG compacto)
 * Basado en el formato de Andy Kurnia's Wolges
 */

export interface KWGNode {
  tile: number;        // 0-255, índice de la ficha
  accepts: boolean;    // Si acepta como final de palabra
  isEnd: boolean;      // Si es el final de un arco
  arcIndex: number;    // Índice del siguiente arco
}

export class KWGReader {
  private data: DataView;
  private nodeCount: number;
  
  // Mapeo de tiles a caracteres para español
  private readonly TILE_TO_CHAR: Record<number, string> = {
    0: '?',   // Comodín
    1: 'A',
    2: 'B', 
    3: 'C',
    4: 'Ç',   // CH
    5: 'D',
    6: 'E',
    7: 'F',
    8: 'G',
    9: 'H',
    10: 'I',
    11: 'J',
    12: 'K',  // LL
    13: 'L',
    14: 'M',
    15: 'N',
    16: 'Ñ',
    17: 'O',
    18: 'P',
    19: 'Q',
    20: 'R',
    21: 'S',
    22: 'T',
    23: 'U',
    24: 'V',
    25: 'W',  // RR
    26: 'X',
    27: 'Y',
    28: 'Z',
    31: '^'   // Separador en GADDAG
  };
  
  // Mapeo inverso
  private readonly CHAR_TO_TILE: Record<string, number> = {};
  
  constructor(buffer: ArrayBuffer) {
    this.data = new DataView(buffer);
    this.nodeCount = this.data.byteLength / 4; // 4 bytes por nodo
    
    // Crear mapeo inverso
    for (const [tile, char] of Object.entries(this.TILE_TO_CHAR)) {
      this.CHAR_TO_TILE[char] = parseInt(tile);
    }
    
    console.log(`📚 KWG cargado: ${this.nodeCount} nodos`);
  }
  
  /**
   * Lee un nodo del KWG
   * Formato: 32 bits (4 bytes) por nodo
   * - bits 0-7: tile (8 bits)
   * - bit 8: accepts
   * - bit 9: is_end
   * - bits 10-31: arc_index (22 bits)
   */
  private readNode(index: number): KWGNode {
    if (index >= this.nodeCount) {
      throw new Error(`Índice fuera de rango: ${index}`);
    }
    
    const offset = index * 4;
    const entry = this.data.getUint32(offset, true); // Little-endian
    
    return {
      tile: entry & 0xFF,
      accepts: ((entry >> 8) & 1) === 1,
      isEnd: ((entry >> 9) & 1) === 1,
      arcIndex: entry >> 10
    };
  }
  
  /**
   * Verifica si una palabra es válida
   */
  public isValidWord(word: string): boolean {
    const tiles = this.wordToTiles(word);
    return this.checkWord(tiles);
  }
  
  /**
   * Convierte una palabra a array de tiles
   */
  private wordToTiles(word: string): number[] {
    const tiles: number[] = [];
    const upperWord = word.toUpperCase();
    
    for (let i = 0; i < upperWord.length; i++) {
      const char = upperWord[i];
      const tile = this.CHAR_TO_TILE[char];
      
      if (tile === undefined) {
        console.warn(`Carácter no reconocido: ${char}`);
        return [];
      }
      
      tiles.push(tile);
    }
    
    return tiles;
  }
  
  /**
   * Verifica si una secuencia de tiles forma una palabra válida
   */
  private checkWord(tiles: number[]): boolean {
    // GADDAG requiere buscar desde el medio de la palabra
    // Por ahora implementamos búsqueda simple, después optimizamos
    
    let nodeIndex = 0;
    
    for (const tile of tiles) {
      const node = this.readNode(nodeIndex);
      
      // Buscar el tile en los hijos del nodo actual
      let found = false;
      let currentIndex = nodeIndex;
      
      while (true) {
        const current = this.readNode(currentIndex);
        
        if (current.tile === tile) {
          found = true;
          nodeIndex = current.arcIndex;
          break;
        }
        
        if (current.isEnd) {
          break; // No más hermanos
        }
        
        currentIndex++;
      }
      
      if (!found) {
        return false;
      }
    }
    
    // Verificar si el último nodo acepta
    const finalNode = this.readNode(nodeIndex);
    return finalNode.accepts;
  }
  
  /**
   * Genera movimientos usando el KWG
   * (Por implementar - reemplazará la búsqueda exhaustiva)
   */
  public generateMoves(
    rack: string[],
    board: any[][],
    anchors: Array<{row: number, col: number}>
  ): any[] {
    // TODO: Implementar generación eficiente con GADDAG
    console.log('🚧 Generación con KWG pendiente de implementación');
    return [];
  }
  
  /**
   * Carga un archivo KWG desde una URL
   */
  public static async loadFromUrl(url: string): Promise<KWGReader> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new KWGReader(buffer);
  }
  
  /**
   * Estadísticas del KWG
   */
  public getStats(): any {
    return {
      nodeCount: this.nodeCount,
      sizeInBytes: this.data.byteLength,
      sizeInMB: (this.data.byteLength / (1024 * 1024)).toFixed(2)
    };
  }
}