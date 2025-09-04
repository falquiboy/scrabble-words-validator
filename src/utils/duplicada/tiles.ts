// Configuración de fichas del Scrabble español y sistema de reparto
import { TileInfo } from '@/types/duplicada/tournament';

// Distribución oficial de fichas del Scrabble español
export const SPANISH_TILES: TileInfo[] = [
  { letter: 'A', points: 1, quantity: 12 },
  { letter: 'E', points: 1, quantity: 12 },
  { letter: 'O', points: 1, quantity: 9 },
  { letter: 'I', points: 1, quantity: 6 },
  { letter: 'S', points: 1, quantity: 6 },
  { letter: 'N', points: 1, quantity: 5 },
  { letter: 'L', points: 1, quantity: 4 },
  { letter: 'R', points: 1, quantity: 5 },
  { letter: 'U', points: 1, quantity: 5 },
  { letter: 'T', points: 1, quantity: 4 },
  { letter: 'D', points: 2, quantity: 5 },
  { letter: 'G', points: 2, quantity: 2 },
  { letter: 'C', points: 3, quantity: 4 },
  { letter: 'B', points: 3, quantity: 2 },
  { letter: 'M', points: 3, quantity: 2 },
  { letter: 'P', points: 3, quantity: 2 },
  { letter: 'H', points: 4, quantity: 2 },
  { letter: 'F', points: 4, quantity: 1 },
  { letter: 'V', points: 4, quantity: 1 },
  { letter: 'Y', points: 4, quantity: 1 },
  { letter: 'Ç', points: 5, quantity: 1 }, // CH procesado
  { letter: 'Ñ', points: 8, quantity: 1 },
  { letter: 'J', points: 8, quantity: 1 },
  { letter: 'K', points: 8, quantity: 1 },
  { letter: 'Q', points: 5, quantity: 1 },
  { letter: 'W', points: 8, quantity: 1 },
  { letter: 'X', points: 8, quantity: 1 },
  { letter: 'Z', points: 10, quantity: 1 },
  { letter: '?', points: 0, quantity: 2 }, // Comodines
];

// Crear el saco completo de fichas
export function createTileBag(): string[] {
  const bag: string[] = [];
  
  SPANISH_TILES.forEach(tile => {
    for (let i = 0; i < tile.quantity; i++) {
      bag.push(tile.letter);
    }
  });
  
  return bag;
}

// Sistema de reparto truly random usando crypto
export class TileBagManager {
  private bag: string[];
  
  constructor() {
    this.bag = createTileBag();
    this.shuffle();
  }
  
  // Shuffle usando crypto.getRandomValues para true randomness
  private shuffle(): void {
    const array = this.bag;
    const randomValues = new Uint32Array(array.length);
    crypto.getRandomValues(randomValues);
    
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor((randomValues[i] / 0xFFFFFFFF) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  // Sacar 7 fichas del saco
  drawTiles(count: number = 7): string[] {
    if (this.bag.length < count) {
      throw new Error(`No hay suficientes fichas. Quedan: ${this.bag.length}`);
    }
    
    return this.bag.splice(0, count);
  }
  
  // Obtener fichas restantes
  getRemainingCount(): number {
    return this.bag.length;
  }
  
  // Resetear el saco
  reset(): void {
    this.bag = createTileBag();
    this.shuffle();
  }
  
  // Obtener valor en puntos de una ficha
  static getTileValue(letter: string): number {
    const tile = SPANISH_TILES.find(t => t.letter === letter);
    return tile?.points || 0;
  }
}

// Función para generar un conjunto específico de fichas para testing
export function generateTestTiles(): string[] {
  const bag = new TileBagManager();
  return bag.drawTiles(7);
}

// Seed específico para reproducibilidad en torneos (opcional)
export function generateSeededTiles(seed: string, round: number): string[] {
  // Para usar en producción con seeds reproducibles si se requiere
  // Por ahora usa true random
  const bag = new TileBagManager();
  return bag.drawTiles(7);
}