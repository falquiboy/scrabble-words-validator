// GORDON'S ALGORITHM - Native Implementation
// Based on "A Faster Scrabble Move Generation Algorithm" by Steven A. Gordon
// Uses Spanish GADDAG for exhaustive move generation

import { BoardCell } from '@/types/duplicada/tournament';
import { SpanishGaddag } from './SpanishGaddag';

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
  crossWords: string[];
}

export interface Anchor {
  row: number;
  col: number;
  crossCheckH: Set<string>; // Valid letters horizontally
  crossCheckV: Set<string>; // Valid letters vertically
}

export class GordonMoveGenerator {
  private gaddag: SpanishGaddag;
  private isLoaded = false;

  constructor() {
    console.log('🚀 GORDON MOVE GENERATOR: Initializing native Spanish GADDAG');
    this.gaddag = new SpanishGaddag();
    this.loadSpanishLexicon();
  }

  /**
   * Load Spanish lexicon from CSV and build GADDAG
   */
  private async loadSpanishLexicon(): Promise<void> {
    try {
      console.log('📚 Loading Spanish lexicon for GADDAG construction...');
      
      // Load from lexicon_keys.csv
      await this.gaddag.loadFromCsv('/csvs/lexicon_keys.csv');
      
      const stats = this.gaddag.getStats();
      console.log('✅ Spanish GADDAG loaded successfully!');
      console.log(`📊 GADDAG Stats:`, stats);
      
      this.isLoaded = true;
      
    } catch (error) {
      console.error('❌ Failed to load Spanish GADDAG:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Generate ALL possible moves using Gordon's algorithm
   */
  async generateAllMoves(
    rack: string[],
    board: BoardCell[][],
    maxMoves: number = 100
  ): Promise<ScrabbleMove[]> {
    if (!this.isReady()) {
      console.log('⏳ GADDAG not ready, waiting...');
      await this.waitForLoad();
    }

    console.log(`🔥 GORDON'S ALGORITHM: Generating ALL moves for rack [${rack.join(', ')}]`);
    const startTime = Date.now();

    // For empty board, use simplified anagram finding
    if (this.isBoardEmpty(board)) {
      console.log('📍 Empty board detected - using anagram generation');
      return await this.generateOpeningMoves(rack);
    }

    // Generate moves from board anchors
    const anchors = this.findAnchors(board);
    console.log(`🎯 Found ${anchors.length} anchor squares`);

    const moves = this.gaddag.generateAllMoves(rack, this.boardToStringArray(board), anchors);
    
    // Convert to ScrabbleMove format and calculate scores
    const scoredMoves = moves.map(move => this.convertToScrabbleMove(move, board));
    
    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score);
    
    const endTime = Date.now();
    console.log(`✅ GORDON'S RESULT: Generated ${scoredMoves.length} moves in ${endTime - startTime}ms`);
    
    return scoredMoves.slice(0, maxMoves);
  }

  /**
   * Generate opening moves (empty board)
   */
  private async generateOpeningMoves(rack: string[]): Promise<ScrabbleMove[]> {
    console.log('🎯 Generating opening moves using GADDAG anagram search');
    
    // Find all possible words
    const words = this.gaddag.findAllWords(rack);
    
    console.log(`🔍 Found ${words.length} anagrams: [${words.slice(0, 10).join(', ')}${words.length > 10 ? '...' : ''}]`);
    
    // Convert words to moves (place horizontally through center)
    const moves: ScrabbleMove[] = [];
    const centerRow = 7; // 15x15 board, center is row 7
    
    for (const word of words.slice(0, 50)) { // Limit for performance
      if (word.length <= 7) { // Fits in a rack
        const startCol = 7 - Math.floor(word.length / 2); // Center the word
        
        const move: ScrabbleMove = {
          word: word,
          startRow: centerRow,
          startCol: startCol,
          direction: 'horizontal',
          tilesPlaced: word.split('').map((letter, i) => ({
            row: centerRow,
            col: startCol + i,
            letter: letter,
            isWildcard: false
          })),
          score: this.calculateScore(word, centerRow, startCol, 'horizontal'),
          crossWords: []
        };
        
        moves.push(move);
      }
    }
    
    // Sort by score
    moves.sort((a, b) => b.score - a.score);
    
    console.log(`✅ Generated ${moves.length} opening moves`);
    return moves;
  }

  /**
   * Find anchor squares on the board
   */
  private findAnchors(board: BoardCell[][]): Array<{row: number, col: number}> {
    const anchors: Array<{row: number, col: number}> = [];
    
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (this.isAnchor(board, row, col)) {
          anchors.push({row, col});
        }
      }
    }
    
    return anchors;
  }

  /**
   * Check if a square is an anchor
   */
  private isAnchor(board: BoardCell[][], row: number, col: number): boolean {
    // Empty square adjacent to a filled square, or center square if board is empty
    if (board[row][col].letter) return false; // Already occupied
    
    // Check adjacent squares
    const directions = [[-1,0], [1,0], [0,-1], [0,1]];
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
        if (board[newRow][newCol].letter) {
          return true; // Adjacent to filled square
        }
      }
    }
    
    // Center square if board is empty
    return row === 7 && col === 7 && this.isBoardEmpty(board);
  }

  /**
   * Check if board is empty
   */
  private isBoardEmpty(board: BoardCell[][]): boolean {
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col].letter) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Convert board to string array for GADDAG
   */
  private boardToStringArray(board: BoardCell[][]): string[][] {
    return board.map(row => 
      row.map(cell => cell.letter || '')
    );
  }

  /**
   * Convert GADDAG move to ScrabbleMove
   */
  private convertToScrabbleMove(
    move: {word: string, row: number, col: number, direction: 'H' | 'V', tiles: any[]},
    board: BoardCell[][]
  ): ScrabbleMove {
    return {
      word: move.word,
      startRow: move.row,
      startCol: move.col,
      direction: move.direction === 'H' ? 'horizontal' : 'vertical',
      tilesPlaced: [], // TODO: calculate actual tiles placed
      score: this.calculateScore(move.word, move.row, move.col, move.direction === 'H' ? 'horizontal' : 'vertical'),
      crossWords: []
    };
  }

  /**
   * Calculate move score (simplified)
   */
  private calculateScore(word: string, startRow: number, startCol: number, direction: string): number {
    // Simplified scoring - just letter values for now
    const letterValues: Record<string, number> = {
      'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1,
      'L': 1, 'N': 1, 'R': 1, 'S': 1, 'T': 1,
      'D': 2, 'G': 2,
      'B': 3, 'C': 3, 'M': 3, 'P': 3,
      'F': 4, 'H': 4, 'V': 4, 'Y': 4,
      'Ç': 5, // CH digraph
      'K': 8, // LL digraph 
      'W': 8, // RR digraph
      'J': 8, 'Ñ': 8, 'Q': 8, 'X': 8,
      'Z': 10
    };
    
    let score = 0;
    for (const letter of word) {
      score += letterValues[letter] || 1;
    }
    
    // Bonus for using all tiles
    if (word.length === 7) {
      score += 50;
    }
    
    return score;
  }

  /**
   * Wait for GADDAG to load
   */
  private async waitForLoad(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (!this.isReady() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isReady()) {
      throw new Error('GADDAG failed to load within timeout');
    }
  }

  /**
   * Check if generator is ready
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Get generator stats
   */
  getStats() {
    return {
      isLoaded: this.isLoaded,
      gaddagStats: this.gaddag.getStats()
    };
  }
}