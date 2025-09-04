// GADDAG Move Generator - Clean Implementation
// Uses Gordon's native GADDAG implementation

import { BoardCell } from '@/types/duplicada/tournament';
import { GordonMoveGenerator } from './GordonMoveGenerator';

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

export class GaddagMoveGenerator {
  private gordonMoveGenerator: GordonMoveGenerator;
  private isLoaded = false;

  constructor() {
    console.log('🚀🚀🚀 INITIALIZING GORDON MOVE GENERATOR - NATIVE SPANISH GADDAG');
    this.gordonMoveGenerator = new GordonMoveGenerator();
    this.isLoaded = true;
  }

  /**
   * Check if generator is ready
   */
  public isReady(): boolean {
    return this.isLoaded && this.gordonMoveGenerator.isReady();
  }

  /**
   * Generate ALL possible moves using Gordon's algorithm
   */
  public async generateAllMoves(
    rack: string[],
    board: BoardCell[][],
    maxMoves: number = 50
  ): Promise<ScrabbleMove[]> {
    console.log(`🚀 GORDON'S ALGORITHM: Delegating to native GADDAG implementation`);
    
    // Use Gordon's native implementation
    return await this.gordonMoveGenerator.generateAllMoves(rack, board, maxMoves);
  }

  /**
   * Wait for generator to load
   */
  private async waitForLoad(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (!this.isReady() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isReady()) {
      throw new Error('Generator failed to load within timeout');
    }
  }

  /**
   * Get generator stats
   */
  getStats() {
    return {
      isLoaded: this.isLoaded,
      gordonStats: this.gordonMoveGenerator.getStats()
    };
  }
}