// Configuración y utilidades del tablero de Scrabble
import { BoardCell, CellType } from '@/types/duplicada/tournament';

// Tablero estándar de 15x15 con multiplicadores
export const BOARD_SIZE = 15;

// Template del tablero con multiplicadores estándar
const BOARD_TEMPLATE: CellType[][] = [
  ['tw', 'normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'tw', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal', 'tw'],
  ['normal', 'dw', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'dw', 'normal'],
  ['normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'dl', 'normal', 'dl', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal'],
  ['dl', 'normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal', 'dl'],
  ['normal', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'normal'],
  ['normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal'],
  ['normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'dl', 'normal', 'dl', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal'],
  ['tw', 'normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'star', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal', 'tw'],
  ['normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'dl', 'normal', 'dl', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal'],
  ['normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal'],
  ['normal', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'normal'],
  ['dl', 'normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal', 'dl'],
  ['normal', 'normal', 'dw', 'normal', 'normal', 'normal', 'dl', 'normal', 'dl', 'normal', 'normal', 'normal', 'dw', 'normal', 'normal'],
  ['normal', 'dw', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'tl', 'normal', 'normal', 'normal', 'dw', 'normal'],
  ['tw', 'normal', 'normal', 'dl', 'normal', 'normal', 'normal', 'tw', 'normal', 'normal', 'normal', 'dl', 'normal', 'normal', 'tw']
];

// Crear tablero vacío con multiplicadores
export function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = {
        row,
        col,
        type: BOARD_TEMPLATE[row][col],
        tile: undefined,
        isFixed: false
      };
    }
  }
  
  return board;
}

// Obtener el multiplicador de una celda
export function getCellMultiplier(cellType: CellType): { wordMultiplier: number; letterMultiplier: number } {
  switch (cellType) {
    case 'dw': return { wordMultiplier: 2, letterMultiplier: 1 };
    case 'tw': return { wordMultiplier: 3, letterMultiplier: 1 };
    case 'dl': return { wordMultiplier: 1, letterMultiplier: 2 };
    case 'tl': return { wordMultiplier: 1, letterMultiplier: 3 };
    case 'star': return { wordMultiplier: 2, letterMultiplier: 1 }; // Centro = doble palabra
    default: return { wordMultiplier: 1, letterMultiplier: 1 };
  }
}

// Verificar si una posición está en el tablero
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

// Obtener clase CSS para el tipo de celda
export function getCellClassName(cellType: CellType, hasTile: boolean): string {
  const baseClasses = 'w-8 h-8 border border-gray-400 flex items-center justify-center text-xs font-bold';
  
  if (hasTile) {
    return `${baseClasses} bg-yellow-200 text-black`;
  }
  
  switch (cellType) {
    case 'dw': return `${baseClasses} bg-pink-200 text-pink-800`;
    case 'tw': return `${baseClasses} bg-red-300 text-red-900`;
    case 'dl': return `${baseClasses} bg-blue-200 text-blue-800`;
    case 'tl': return `${baseClasses} bg-green-200 text-green-800`;
    case 'star': return `${baseClasses} bg-pink-300 text-pink-900`;
    default: return `${baseClasses} bg-gray-100 text-gray-600`;
  }
}

// Obtener texto para mostrar en la celda
export function getCellDisplay(cellType: CellType, tile?: string): string {
  if (tile) return tile;
  
  switch (cellType) {
    case 'dw': return '2P';
    case 'tw': return '3P';
    case 'dl': return '2L';
    case 'tl': return '3L';
    case 'star': return '★';
    default: return '';
  }
}

// Colocar una palabra en el tablero
export function placeWordOnBoard(
  board: BoardCell[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical',
  tilesPlaced?: Array<{row: number, col: number, letter: string, isWildcard: boolean}>
): BoardCell[][] {
  // Crear una copia profunda del tablero
  const newBoard = board.map(row => 
    row.map(cell => ({ ...cell }))
  );
  
  // Si tenemos información detallada de las fichas, usarla
  if (tilesPlaced) {
    tilesPlaced.forEach(tile => {
      if (isValidPosition(tile.row, tile.col)) {
        newBoard[tile.row][tile.col].tile = tile.letter;
        newBoard[tile.row][tile.col].isFixed = true;
        newBoard[tile.row][tile.col].isWildcard = tile.isWildcard;
      }
    });
  } else {
    // Colocar cada letra de la palabra (sin información de comodines)
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (isValidPosition(row, col)) {
        newBoard[row][col].tile = word[i];
        newBoard[row][col].isFixed = true;
      }
    }
  }
  
  return newBoard;
}