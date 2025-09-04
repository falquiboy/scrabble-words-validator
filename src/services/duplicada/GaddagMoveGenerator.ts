// Spanish Word Set Move Generator for Scrabble
// Ultra-fast move generation using Spanish word validation (LOCAL ONLY)

import { BoardCell } from '@/types/duplicada/tournament';
import { TileBagManager } from '@/utils/duplicada/tiles';
import { KwgReader } from './KwgReader';
import { KwgReaderV2 } from './KwgReaderV2';
import { KwgAnalyzer } from './KwgAnalyzer';
import { KwgReaderFixed } from './KwgReaderFixed';
import { KwgReaderFinal } from './KwgReaderFinal';
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

interface BoardAnchor {
  row: number;
  col: number;
  direction: 'horizontal' | 'vertical';
  crossCheck: Set<string>; // Valid letters for this position
}

export class GaddagMoveGenerator {
  private kwgReader: KwgReader;
  private kwgReaderV2: KwgReaderV2;
  private kwgAnalyzer: KwgAnalyzer;
  private kwgReaderFixed: KwgReaderFixed;
  private kwgReaderFinal: KwgReaderFinal;
  private gordonMoveGenerator: GordonMoveGenerator;
  private isLoaded = false;

  constructor() {
    // 🚀 NEW STRATEGY: Use Gordon's native GADDAG implementation
    console.log('🚀🚀🚀 INITIALIZING GORDON MOVE GENERATOR - NATIVE SPANISH GADDAG');
    this.gordonMoveGenerator = new GordonMoveGenerator();
    this.isLoaded = true; // Gordon generator handles its own loading
  }

  /**
   * Load Spanish KWG GADDAG file
   */
  private async loadKwgFile(): Promise<void> {
    try {
      console.log('🎯🎯🎯 LOADING FIXED KWG WITH CORRECT BIT INTERPRETATION!');

      await this.kwgReaderFinal.loadFromUrl('/spanish_scrabble.kwg');
      
      const stats = this.kwgReaderFinal.getStats();
      console.log(`📊🎯 FIXED KWG Stats: ${stats.nodeCount.toLocaleString()} nodes, ${stats.fileSize} bytes`);

      this.isLoaded = true;
      console.log('✅🎯 FIXED KWG loaded successfully - READY FOR REAL GADDAG SEARCH!');

    } catch (error) {
      console.error('❌ Error loading FIXED KWG:', error);
    }
  }

  /**
   * Check if KWG is ready for move generation
   */
  public isReady(): boolean {
    return this.isLoaded && this.gordonMoveGenerator.isReady();
  }

  /**
   * Check if a word is valid using FIXED KWG GADDAG
   */
  public isValidWord(word: string): boolean {
    if (!word || word.length < 2) return false;
    
    const isValid = this.kwgReaderFixed.hasWord(word);
    
    // Debug logging for validation
    if (word.length >= 4) {
      console.log(`🎯 FIXED KWG validation: ${word.toUpperCase()} = ${isValid ? '✅' : '❌'}`);
    }
    
    return isValid;
  }

  /**
   * Check if word is valid considering rack constraints for digraphs
   * Only processes digraphs if we actually have the required tiles in rack
   */
  private isValidWordFromRack(word: string, tilesUsed: string[], rackCounts: Map<string, number>): boolean {
    if (!word || word.length < 2) return false;
    
    const upperWord = word.toUpperCase();
    let processedWord = upperWord;
    
    // Process digraphs only if we have the tiles for them
    // LL → K (only if we used two L's from rack)
    if (upperWord.includes('LL')) {
      const llCount = (upperWord.match(/LL/g) || []).length;
      const usedLCount = tilesUsed.filter(t => t === 'L').length;
      
      // Only process LL → K if we used at least 2 L's per LL digraph needed
      if (usedLCount >= llCount * 2) {
        processedWord = processedWord.replace(/LL/g, 'K');
        console.log(`🔤 Rack dígrafo LL: ${upperWord} → ${processedWord} (usé ${usedLCount} L's)`);
      } else {
        console.log(`❌ No hay suficientes L's: necesito ${llCount * 2}, tengo ${usedLCount}`);
        return false;
      }
    }
    
    // CH → Ç (only if we used C and H from rack)
    if (upperWord.includes('CH')) {
      const chCount = (upperWord.match(/CH/g) || []).length;
      const usedCCount = tilesUsed.filter(t => t === 'C').length;
      const usedHCount = tilesUsed.filter(t => t === 'H').length;
      
      if (usedCCount >= chCount && usedHCount >= chCount) {
        processedWord = processedWord.replace(/CH/g, 'Ç');
        console.log(`🔤 Rack dígrafo CH: ${upperWord} → ${processedWord}`);
      } else {
        return false;
      }
    }
    
    // RR → W (only if we used two R's from rack)
    if (upperWord.includes('RR')) {
      const rrCount = (upperWord.match(/RR/g) || []).length;
      const usedRCount = tilesUsed.filter(t => t === 'R').length;
      
      if (usedRCount >= rrCount * 2) {
        processedWord = processedWord.replace(/RR/g, 'W');
        console.log(`🔤 Rack dígrafo RR: ${upperWord} → ${processedWord}`);
      } else {
        return false;
      }
    }
    
    return this.wordSet.has(processedWord);
  }

  /**
   * Generate moves using KWG GADDAG - finds ALL anagrams automatically
   */
  private async generateMovesWithKwgGaddag(
    rack: string[],
    board: BoardCell[][],
    moves: ScrabbleMove[]
  ): Promise<void> {
    console.log(`🎯🎯🎯 FIXED GADDAG: Finding ALL anagrams for rack [${rack.join(', ')}]`);
    console.log(`🎯🎯🎯 REAL GADDAG SEARCH WITH CORRECT BIT INTERPRETATION!`);
    
    // Check if FINAL reader is ready
    if (!this.kwgReaderFinal.isReady()) {
      console.log('❌ FINAL KWG not ready, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`🔥 FINAL KWG Ready Status: ${this.kwgReaderFinal.isReady()}`);
    console.log(`🔥 FINAL KWG Stats:`, this.kwgReaderFinal.getStats());
    
    console.log(`🚀 Starting REAL GADDAG search for ALL ANAGRAMS...`);
    const allWords = await this.kwgReaderFinal.findAllWords(rack);
    
    console.log(`🎯🎯🎯 FIXED GADDAG found ${allWords.length} total words: [${allWords.join(', ')}]`);
    console.log(`🎯 This should include ALL anagrams: TAZARES, RETAZAS, ESTARZA, ESTRAZA, TRAZASE!`);
    
    // Filter by length and generate moves for each word
    for (const word of allWords) {
      if (word.length < 2) continue;
      
      console.log(`🔥 Processing word for moves: ${word}`);
      
      // For empty board, try all center-crossing positions
      if (this.isBoardEmpty(board)) {
        await this.generateCenterCrossingMovesForWord(word, board, moves);
      } else {
        // For non-empty board, try anchor positions (TODO: implement)
        console.log(`⚠️ Non-empty board not yet implemented for word: ${word}`);
      }
    }
    
    console.log(`✅✅✅ FIXED GADDAG generated ${moves.length} total moves`);
    
    // Summary of anagrams found
    const sevenLetterWords = allWords.filter(w => w.length === 7);
    if (sevenLetterWords.length > 0) {
      console.log(`🏆 7-letter anagrams found: [${sevenLetterWords.join(', ')}]`);
    }
  }

  /**
   * Generate all center-crossing positions for a specific word
   */
  private async generateCenterCrossingMovesForWord(
    word: string,
    board: BoardCell[][],
    moves: ScrabbleMove[]
  ): Promise<void> {
    const CENTER_ROW = 7;
    const CENTER_COL = 7;
    const wordLength = word.length;
    
    // HORIZONTAL placements that cross center (7,7)
    for (let startCol = 0; startCol <= CENTER_COL; startCol++) {
      const endCol = startCol + wordLength - 1;
      
      // Must be within board and include center
      if (endCol >= 15 || endCol < CENTER_COL) continue;
      
      const move = this.createMoveFromWord(
        word, CENTER_ROW, startCol, 'horizontal', board
      );
      
      if (move && move.score > 0) {
        moves.push(move);
        
        if (word.length === 7) {
          console.log(`🎯 ANAGRAMA 7: ${word} at H${startCol + 1}→ = ${move.score} pts`);
        }
      }
    }
    
    // VERTICAL placements that cross center (7,7)
    for (let startRow = 0; startRow <= CENTER_ROW; startRow++) {
      const endRow = startRow + wordLength - 1;
      
      // Must be within board and include center
      if (endRow >= 15 || endRow < CENTER_ROW) continue;
      
      const move = this.createMoveFromWord(
        word, startRow, CENTER_COL, 'vertical', board
      );
      
      if (move && move.score > 0) {
        moves.push(move);
        
        if (word.length === 7) {
          console.log(`🎯 ANAGRAMA 7: ${word} at ${CENTER_COL + 1}${String.fromCharCode(65 + startRow)}↓ = ${move.score} pts`);
        }
      }
    }
  }

  /**
   * Create ScrabbleMove from word and position
   */
  private createMoveFromWord(
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][]
  ): ScrabbleMove | null {
    // Check if word can be placed at this position
    if (!this.canPlaceWordAtPosition(word, startRow, startCol, direction, board)) {
      return null;
    }
    
    // Create tiles placed array
    const tilesPlaced = word.split('').map((letter, index) => ({
      row: direction === 'horizontal' ? startRow : startRow + index,
      col: direction === 'horizontal' ? startCol + index : startCol,
      letter,
      isWildcard: false // TODO: handle wildcards properly
    }));
    
    // Calculate score
    const score = this.calculateWordScore(word, startRow, startCol, direction, board);
    
    return {
      word,
      startRow,
      startCol,
      direction,
      tilesPlaced,
      score,
      crossWords: [] // TODO: calculate cross words
    };
  }

  /**
   * Check if word can be placed at specific position
   */
  private canPlaceWordAtPosition(
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][]
  ): boolean {
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      // Check bounds
      if (row < 0 || row >= 15 || col < 0 || col >= 15) {
        return false;
      }
      
      // Check conflicts with existing tiles
      const cell = board[row][col];
      if (cell.tile && cell.tile !== word[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate score for a word placement (simplified version)
   */
  private calculateWordScore(
    word: string,
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    board: BoardCell[][]
  ): number {
    let score = 0;
    let wordMultiplier = 1;
    
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const letterScore = TileBagManager.getTileValue(letter);
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      // Get cell multipliers (simplified - assumes empty board)
      const cellType = this.getBoardCellType(row, col);
      let letterMultiplier = 1;
      
      switch (cellType) {
        case 'dl': letterMultiplier = 2; break;
        case 'tl': letterMultiplier = 3; break;
        case 'dw': wordMultiplier *= 2; break;
        case 'tw': wordMultiplier *= 3; break;
        case 'star': wordMultiplier *= 2; break; // Center = double word
      }
      
      score += letterScore * letterMultiplier;
    }
    
    // Apply word multiplier
    score *= wordMultiplier;
    
    // Bonus for using all 7 tiles
    if (word.length === 7) {
      score += 50;
    }
    
    return score;
  }

  /**
   * Get board cell type for multiplier calculation
   */
  private getBoardCellType(row: number, col: number): string {
    // Standard Scrabble board layout
    const BOARD_TEMPLATE = [
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
    
    return BOARD_TEMPLATE[row][col];
  }

  /**
   * Generate ALL possible moves using Gordon's algorithm (Macondo-style)
   * Static evaluation only - deterministic for Duplicada
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

    console.log(`🔥 GORDON'S ALGORITHM: Generating ALL moves for rack [${rack.join(', ')}]`);

    const allMoves: ScrabbleMove[] = [];
    const rackCounts = this.createRackCounts(rack);
    const startTime = Date.now();
    
    try {
      // Step 1: Systematic board scan - row by row (like Macondo)
      for (let row = 0; row < 15; row++) {
        await this.scanRowForMoves(board, row, rackCounts, allMoves, 'horizontal');
      }
      
      // Step 2: Systematic board scan - column by column
      for (let col = 0; col < 15; col++) {
        await this.scanColumnForMoves(board, col, rackCounts, allMoves, 'vertical');
      }

      // Step 3: Handle empty board (first move through center)
      if (this.isBoardEmpty(board)) {
        console.log('📍 Empty board detected - using KWG GADDAG search');
        await this.generateMovesWithKwgGaddag(rack, board, allMoves);
      }

      // Step 4: Remove duplicates and sort by score
      const uniqueMoves = this.removeDuplicateMoves(allMoves);
      uniqueMoves.sort((a, b) => b.score - a.score);

      const elapsed = Date.now() - startTime;
      console.log(`✅ GORDON'S RESULT: ${uniqueMoves.length} unique moves generated in ${elapsed}ms`);

      // Debug top moves
      uniqueMoves.slice(0, 3).forEach((move, i) => {
        console.log(`🏆 #${i+1}: ${move.word} at ${this.formatCoordinateDebug(move)} = ${move.score} pts`);
      });

      return uniqueMoves.slice(0, maxMoves);

    } catch (error) {
      console.error('❌ Gordon algorithm failed:', error);
      return [];
    }
  }

  /**
   * Format coordinates for debug output
   */
  private formatCoordinateDebug(move: ScrabbleMove): string {
    const rowLabel = String.fromCharCode(65 + move.startRow);
    const colLabel = move.startCol + 1;
    
    if (move.direction === 'horizontal') {
      return `${rowLabel}${colLabel}→`;
    } else {
      return `${colLabel}${rowLabel}↓`;
    }
  }

  /**
   * Scan a single row for horizontal moves (Gordon's algorithm)
   */
  private async scanRowForMoves(
    board: BoardCell[][],
    row: number,
    rackCounts: Map<string, number>,
    moves: ScrabbleMove[],
    direction: 'horizontal'
  ): Promise<void> {
    // Find anchors in this row
    const anchors = this.findRowAnchors(board, row);
    
    for (const anchorCol of anchors) {
      await this.recursiveGeneration(
        board, row, anchorCol, direction, 
        rackCounts, [], moves
      );
    }
  }

  /**
   * Scan a single column for vertical moves
   */
  private async scanColumnForMoves(
    board: BoardCell[][],
    col: number,
    rackCounts: Map<string, number>,
    moves: ScrabbleMove[],
    direction: 'vertical'
  ): Promise<void> {
    // Find anchors in this column
    const anchors = this.findColumnAnchors(board, col);
    
    for (const anchorRow of anchors) {
      await this.recursiveGeneration(
        board, anchorRow, col, direction,
        rackCounts, [], moves
      );
    }
  }

  /**
   * Find anchor positions in a row
   */
  private findRowAnchors(board: BoardCell[][], row: number): number[] {
    const anchors: number[] = [];
    
    for (let col = 0; col < 15; col++) {
      if (board[row][col].tile) {
        continue; // Skip occupied squares
      }
      
      // Check if this empty square is adjacent to any tile
      if (this.hasAdjacentTileInRow(board, row, col)) {
        anchors.push(col);
      }
    }
    
    return anchors;
  }

  /**
   * Find anchor positions in a column
   */
  private findColumnAnchors(board: BoardCell[][], col: number): number[] {
    const anchors: number[] = [];
    
    for (let row = 0; row < 15; row++) {
      if (board[row][col].tile) {
        continue; // Skip occupied squares
      }
      
      // Check if this empty square is adjacent to any tile
      if (this.hasAdjacentTileInColumn(board, row, col)) {
        anchors.push(row);
      }
    }
    
    return anchors;
  }

  /**
   * Check if position has adjacent tiles for row scanning
   */
  private hasAdjacentTileInRow(board: BoardCell[][], row: number, col: number): boolean {
    // Check all 4 directions
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
   * Check if position has adjacent tiles for column scanning
   */
  private hasAdjacentTileInColumn(board: BoardCell[][], row: number, col: number): boolean {
    return this.hasAdjacentTileInRow(board, row, col); // Same logic
  }

  /**
   * Recursive word generation (Gordon's core algorithm)
   */
  private async recursiveGeneration(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
    rackCounts: Map<string, number>,
    currentWord: string[],
    moves: ScrabbleMove[]
  ): Promise<void> {
    // Try extending the word with available rack tiles
    for (const [tile, count] of rackCounts.entries()) {
      if (count <= 0) continue;
      
      // Use this tile
      const newWord = [...currentWord, tile];
      const newRackCounts = new Map(rackCounts);
      newRackCounts.set(tile, count - 1);
      
      // Check if this forms a valid word
      const wordStr = newWord.join('');
      if (wordStr.length >= 2 && this.isValidWord(wordStr)) {
        // Check if it can be placed on the board
        const move = this.tryPlaceWord(board, row, col, direction, wordStr, newWord);
        if (move && move.score > 0) {
          moves.push(move);
        }
      }
      
      // Continue recursion if we have more tiles and space
      if (newWord.length < 7 && this.canExtendWord(board, row, col, direction, newWord.length)) {
        await this.recursiveGeneration(
          board, row, col, direction, newRackCounts, newWord, moves
        );
      }
    }
  }

  /**
   * Try to place a word on the board at given position
   */
  private tryPlaceWord(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    word: string,
    tiles: string[]
  ): ScrabbleMove | null {
    // Check if word fits and doesn't conflict
    if (!this.canPlaceWordAt(board, startRow, startCol, direction, word)) {
      return null;
    }

    // Calculate score
    const score = this.calculateMoveScore(
      board, 
      { row: startRow, col: startCol, direction, crossCheck: new Set() },
      word,
      tiles
    );

    if (score <= 0) return null;

    // Create move
    const tilesPlaced = tiles.map((letter, index) => ({
      row: direction === 'horizontal' ? startRow : startRow + index,
      col: direction === 'horizontal' ? startCol + index : startCol,
      letter,
      isWildcard: letter === '?'
    }));

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
   * Check if word can be placed at specific position
   */
  private canPlaceWordAt(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    word: string
  ): boolean {
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? startRow : startRow + i;
      const currentCol = direction === 'horizontal' ? startCol + i : startCol;
      
      // Check bounds
      if (currentRow < 0 || currentRow >= 15 || currentCol < 0 || currentCol >= 15) {
        return false;
      }
      
      // Check conflicts with existing tiles
      const cell = board[currentRow][currentCol];
      if (cell.tile && cell.tile !== word[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if word can be extended further
   */
  private canExtendWord(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
    currentLength: number
  ): boolean {
    const nextRow = direction === 'horizontal' ? row : row + currentLength;
    const nextCol = direction === 'horizontal' ? col + currentLength : col;
    
    return nextRow >= 0 && nextRow < 15 && nextCol >= 0 && nextCol < 15;
  }

  /**
   * Generate moves for empty board - ANYWHERE that crosses center (7,7)
   */
  private async generateEmptyBoardMoves(
    board: BoardCell[][],
    rackCounts: Map<string, number>,
    moves: ScrabbleMove[],
    originalRack?: string[]
  ): Promise<void> {
    const CENTER_ROW = 7;
    const CENTER_COL = 7;
    
    console.log('🌟 Generating ALL possible first moves that pass through center (7,7)');
    
    // HORIZONTAL WORDS: Cualquier posición que haga que la palabra pase por el centro
    for (let startCol = 0; startCol < 15; startCol++) {
      for (let wordLen = 2; wordLen <= 7; wordLen++) {
        const endCol = startCol + wordLen - 1;
        
        // Debe estar dentro del tablero
        if (endCol >= 15) continue;
        
        // La palabra debe INCLUIR el centro (7,7) en algún punto
        // Centro está en fila H (row=7) y columna 8 (col=7)
        if (startCol <= CENTER_COL && endCol >= CENTER_COL) {
          // Esta palabra horizontal en fila H pasa por el centro
          await this.generateWordsOfLengthAtPosition(
            board, CENTER_ROW, startCol, 'horizontal', wordLen, rackCounts, moves, originalRack
          );
        }
      }
    }
    
    // VERTICAL WORDS: Cualquier posición que haga que la palabra pase por el centro
    for (let startRow = 0; startRow < 15; startRow++) {
      for (let wordLen = 2; wordLen <= 7; wordLen++) {
        const endRow = startRow + wordLen - 1;
        
        // Debe estar dentro del tablero
        if (endRow >= 15) continue;
        
        // La palabra debe INCLUIR el centro (7,7) en algún punto
        // Centro está en columna 8 (col=7) y fila H (row=7)
        if (startRow <= CENTER_ROW && endRow >= CENTER_ROW) {
          // Esta palabra vertical en columna 8 pasa por el centro
          await this.generateWordsOfLengthAtPosition(
            board, startRow, CENTER_COL, 'vertical', wordLen, rackCounts, moves, originalRack
          );
        }
      }
    }
    
    console.log('🎯 Finished generating all center-crossing positions');
  }

  /**
   * Generate all words of specific length at specific position
   */
  private async generateWordsOfLengthAtPosition(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    targetLength: number,
    rackCounts: Map<string, number>,
    moves: ScrabbleMove[],
    originalRack?: string[]
  ): Promise<void> {
    // Generate all permutations of rack tiles of target length
    const permutations = this.generateTilePermutations(rackCounts, targetLength, originalRack);
    
    for (const perm of permutations) {
      const word = perm.join('');
      
      // Check if valid word (considering rack-based digraph constraints)
      if (this.isValidWordFromRack(word, perm, rackCounts)) {
        // Try to place it
        const move = this.tryPlaceWord(board, startRow, startCol, direction, word, perm);
        if (move && move.score > 0) {
          moves.push(move);
          
          if (word.length === 7) {
            const coord = direction === 'horizontal' ? 
              `${String.fromCharCode(65 + startRow)}${startCol + 1}→` :
              `${startCol + 1}${String.fromCharCode(65 + startRow)}↓`;
            console.log(`🎯 ANAGRAMA 7 letras: ${word} at ${coord} = ${move.score} pts`);
          } else if (word.length >= 6) {
            const coord = direction === 'horizontal' ? 
              `${String.fromCharCode(65 + startRow)}${startCol + 1}→` :
              `${startCol + 1}${String.fromCharCode(65 + startRow)}↓`;
            console.log(`✅ Found: ${word} at ${coord} = ${move.score} pts`);
          }
        }
      }
    }
  }

  /**
   * Generate permutations of tiles with specific length
   */
  private generateTilePermutations(rackCounts: Map<string, number>, length: number, originalRack?: string[]): string[][] {
    // Use original rack order if provided, otherwise reconstruct from rackCounts
    let rack: string[];
    
    if (originalRack) {
      rack = [...originalRack]; // Preserve original order
      console.log(`🎯 Using original rack order: [${rack.join(', ')}]`);
    } else {
      // Fallback to rackCounts (may reorder alphabetically)
      rack = [];
      for (const [tile, count] of rackCounts.entries()) {
        for (let i = 0; i < count; i++) {
          rack.push(tile);
        }
      }
      console.log(`⚠️  Using rackCounts order: [${rack.join(', ')}]`);
    }
    
    if (rack.length < length) return [];
    
    const results: string[][] = [];
    
    // For full rack usage (7 tiles), generate more permutations to find all anagrams
    const maxPermutations = length === rack.length ? 5000 : 100;
    
    this.generatePermutationsOfLength(rack, length, [], results, new Set(), maxPermutations);
    
    console.log(`🔄 Generated ${results.length} permutations for length ${length}`);
    return results;
  }

  /**
   * Generate permutations of specific length
   */
  private generatePermutationsOfLength(
    rack: string[],
    targetLength: number,
    current: string[],
    results: string[][],
    used: Set<number>,
    maxResults: number = 500
  ): void {
    if (current.length === targetLength) {
      results.push([...current]);
      return;
    }

    if (results.length >= maxResults) return; // Performance limit

    for (let i = 0; i < rack.length; i++) {
      if (used.has(i)) continue;
      
      used.add(i);
      current.push(rack[i]);
      this.generatePermutationsOfLength(rack, targetLength, current, results, used, maxResults);
      current.pop();
      used.delete(i);
    }
  }

  /**
   * Remove duplicate moves
   */
  private removeDuplicateMoves(moves: ScrabbleMove[]): ScrabbleMove[] {
    const seen = new Set<string>();
    const unique: ScrabbleMove[] = [];
    
    for (const move of moves) {
      const key = `${move.word}-${move.startRow}-${move.startCol}-${move.direction}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(move);
      }
    }
    
    return unique;
  }

  /**
   * Generate all possible starting positions that cross the center (7,7) - Spanish Scrabble rules
   */
  private generateCenterCrossingPositions(): BoardAnchor[] {
    const anchors: BoardAnchor[] = [];
    const CENTER_ROW = 7; // Fila H (índice 7)
    const CENTER_COL = 7; // Columna 8 (índice 7)
    const crossCheck = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZÑÇ');

    console.log(`🎯 Generating positions for empty board - center at (${CENTER_ROW}, ${CENTER_COL})`);

    // Horizontal positions (fila H, diferentes columnas de inicio)
    // La palabra DEBE pasar por el centro (7,7)
    for (let wordLength = 2; wordLength <= 7; wordLength++) {
      for (let centerPos = 0; centerPos < wordLength; centerPos++) {
        const startCol = CENTER_COL - centerPos;
        const endCol = startCol + wordLength - 1;
        
        // Verificar que la palabra esté dentro del tablero
        if (startCol >= 0 && endCol < 15) {
          anchors.push({
            row: CENTER_ROW,
            col: startCol,
            direction: 'horizontal',
            crossCheck
          });
          
          if (wordLength >= 7) {
            console.log(`➡️ H${startCol + 1}→ (${wordLength} letras, centro en pos ${centerPos})`);
          }
        }
      }
    }

    // Vertical positions (columna 8, diferentes filas de inicio) 
    for (let wordLength = 2; wordLength <= 7; wordLength++) {
      for (let centerPos = 0; centerPos < wordLength; centerPos++) {
        const startRow = CENTER_ROW - centerPos;
        const endRow = startRow + wordLength - 1;
        
        // Verificar que la palabra esté dentro del tablero
        if (startRow >= 0 && endRow < 15) {
          anchors.push({
            row: startRow,
            col: CENTER_COL,
            direction: 'vertical',
            crossCheck
          });
          
          if (wordLength >= 7) {
            console.log(`⬇️ 8${String.fromCharCode(65 + startRow)}↓ (${wordLength} letras, centro en pos ${centerPos})`);
          }
        }
      }
    }

    console.log(`🎯 Generated ${anchors.length} center-crossing positions for first word`);
    return anchors;
  }

  /**
   * Find anchor squares on the board (Quackle-style implementation)
   */
  private findAnchorSquares(board: BoardCell[][]): BoardAnchor[] {
    const anchors: BoardAnchor[] = [];

    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col].tile) {
          continue; // Skip occupied squares
        }

        // Check if this empty square is adjacent to any tile
        const isAnchor = this.isAnchorSquare(board, row, col);
        if (isAnchor) {
          // Create anchor for horizontal moves
          const hCrossCheck = this.calculateCrossCheck(board, row, col, 'horizontal');
          if (hCrossCheck.size > 0) {
            anchors.push({
              row,
              col,
              direction: 'horizontal',
              crossCheck: hCrossCheck
            });
          }

          // Create anchor for vertical moves
          const vCrossCheck = this.calculateCrossCheck(board, row, col, 'vertical');
          if (vCrossCheck.size > 0) {
            anchors.push({
              row,
              col,
              direction: 'vertical',
              crossCheck: vCrossCheck
            });
          }
        }
      }
    }

    console.log(`⚓ Found ${anchors.length} real anchor squares on board`);
    return anchors;
  }

  /**
   * Check if a square is an anchor (adjacent to existing tiles or unrestricted)
   */
  private isAnchorSquare(board: BoardCell[][], row: number, col: number): boolean {
    // Must be empty
    if (board[row][col].tile) return false;

    // Check all 4 adjacent positions for tiles
    const adjacentPositions = [
      [row - 1, col], // North
      [row + 1, col], // South  
      [row, col - 1], // West
      [row, col + 1]  // East
    ];

    for (const [adjRow, adjCol] of adjacentPositions) {
      if (adjRow >= 0 && adjRow < 15 && adjCol >= 0 && adjCol < 15) {
        if (board[adjRow][adjCol].tile) {
          return true; // Adjacent to at least one tile
        }
      }
    }

    return false; // No adjacent tiles
  }

  /**
   * Check if position has adjacent tiles
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
   * Calculate cross-check letters for a square (Quackle-style)
   */
  private calculateCrossCheck(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical'
  ): Set<string> {
    // For cross-checks, we need to look perpendicular to the move direction
    const perpDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
    
    // Get the cross-word that would be formed
    const crossWord = this.getCrossWord(board, row, col, perpDirection);
    
    if (crossWord === null) {
      // No cross-word formed, all letters valid
      return new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZÑÇ');
    }
    
    const validLetters = new Set<string>();
    
    // Test each possible letter to see if it forms a valid cross-word
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑÇ') {
      const testWord = this.insertLetterInCrossWord(crossWord, letter);
      if (this.isValidWord(testWord)) {
        validLetters.add(letter);
      }
    }
    
    return validLetters;
  }

  /**
   * Get the cross-word that would be formed by placing a letter at this position
   */
  private getCrossWord(
    board: BoardCell[][],
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical'
  ): { prefix: string; suffix: string; position: number } | null {
    let prefix = '';
    let suffix = '';
    
    if (direction === 'horizontal') {
      // Look left for prefix
      for (let c = col - 1; c >= 0; c--) {
        if (board[row][c].tile) {
          prefix = board[row][c].tile + prefix;
        } else {
          break;
        }
      }
      
      // Look right for suffix
      for (let c = col + 1; c < 15; c++) {
        if (board[row][c].tile) {
          suffix += board[row][c].tile;
        } else {
          break;
        }
      }
    } else {
      // Look up for prefix
      for (let r = row - 1; r >= 0; r--) {
        if (board[r][col].tile) {
          prefix = board[r][col].tile + prefix;
        } else {
          break;
        }
      }
      
      // Look down for suffix
      for (let r = row + 1; r < 15; r++) {
        if (board[r][col].tile) {
          suffix += board[r][col].tile;
        } else {
          break;
        }
      }
    }
    
    // If no adjacent letters, no cross-word constraint
    if (prefix.length === 0 && suffix.length === 0) {
      return null;
    }
    
    return {
      prefix,
      suffix,
      position: prefix.length
    };
  }

  /**
   * Insert a letter into a cross-word pattern
   */
  private insertLetterInCrossWord(
    crossWord: { prefix: string; suffix: string; position: number },
    letter: string
  ): string {
    return crossWord.prefix + letter + crossWord.suffix;
  }

  /**
   * Generate moves from a specific anchor point using GADDAG-style algorithm
   */
  private async generateMovesFromAnchor(
    rack: string[],
    board: BoardCell[][],
    anchor: BoardAnchor,
    wildcardCount: number
  ): Promise<ScrabbleMove[]> {
    const moves: ScrabbleMove[] = [];
    const { row, col, direction, crossCheck } = anchor;

    // Create rack tracking for tile consumption
    const rackCounts = this.createRackCounts(rack);

    // Start generation from anchor square
    if (direction === 'horizontal') {
      // Generate horizontal words through this anchor
      await this.generateHorizontalWords(board, row, col, rackCounts, crossCheck, moves);
    } else {
      // Generate vertical words through this anchor
      await this.generateVerticalWords(board, row, col, rackCounts, crossCheck, moves);
    }

    return moves;
  }

  /**
   * Create rack tile counts for efficient tracking
   */
  private createRackCounts(rack: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const tile of rack) {
      counts.set(tile, (counts.get(tile) || 0) + 1);
    }
    return counts;
  }

  /**
   * Generate horizontal words through anchor square (leftpart + extendright)
   */
  private async generateHorizontalWords(
    board: BoardCell[][],
    anchorRow: number,
    anchorCol: number,
    rackCounts: Map<string, number>,
    crossCheck: Set<string>,
    moves: ScrabbleMove[]
  ): Promise<void> {
    // Check if there are tiles to the left of anchor that restrict where we can start
    const leftLimit = this.findLeftLimit(board, anchorRow, anchorCol);
    
    // For each possible starting position to the left of anchor
    for (let startCol = leftLimit; startCol <= anchorCol; startCol++) {
      // Generate word starting at startCol, going through anchor
      await this.generateWordFromPosition(
        board, anchorRow, startCol, 'horizontal', 
        rackCounts, crossCheck, anchorCol, moves
      );
    }
  }

  /**
   * Generate vertical words through anchor square
   */
  private async generateVerticalWords(
    board: BoardCell[][],
    anchorRow: number,
    anchorCol: number,
    rackCounts: Map<string, number>,
    crossCheck: Set<string>,
    moves: ScrabbleMove[]
  ): Promise<void> {
    // Check if there are tiles above anchor that restrict where we can start
    const topLimit = this.findTopLimit(board, anchorRow, anchorCol);
    
    // For each possible starting position above anchor
    for (let startRow = topLimit; startRow <= anchorRow; startRow++) {
      // Generate word starting at startRow, going through anchor
      await this.generateWordFromPosition(
        board, startRow, anchorCol, 'vertical',
        rackCounts, crossCheck, anchorRow, moves
      );
    }
  }

  /**
   * Find leftmost position where we can start a horizontal word
   */
  private findLeftLimit(board: BoardCell[][], row: number, anchorCol: number): number {
    // Look left from anchor to find existing tiles or board edge
    for (let col = anchorCol - 1; col >= 0; col--) {
      if (board[row][col].tile) {
        // Found tile, must start after it
        return col + 1;
      }
      // Check if square to the left would create unwanted cross-words
      if (this.hasVerticalNeighbor(board, row, col)) {
        // Can't start here, would create invalid cross-word
        return col + 1;
      }
    }
    return 0; // Can start at left edge
  }

  /**
   * Find topmost position where we can start a vertical word
   */
  private findTopLimit(board: BoardCell[][], anchorRow: number, col: number): number {
    // Look up from anchor to find existing tiles or board edge
    for (let row = anchorRow - 1; row >= 0; row--) {
      if (board[row][col].tile) {
        // Found tile, must start after it
        return row + 1;
      }
      // Check if square above would create unwanted cross-words
      if (this.hasHorizontalNeighbor(board, row, col)) {
        // Can't start here, would create invalid cross-word
        return row + 1;
      }
    }
    return 0; // Can start at top edge
  }

  /**
   * Check if position has vertical neighbors (for horizontal word generation)
   */
  private hasVerticalNeighbor(board: BoardCell[][], row: number, col: number): boolean {
    return (row > 0 && board[row - 1][col].tile) || 
           (row < 14 && board[row + 1][col].tile);
  }

  /**
   * Check if position has horizontal neighbors (for vertical word generation)
   */
  private hasHorizontalNeighbor(board: BoardCell[][], row: number, col: number): boolean {
    return (col > 0 && board[row][col - 1].tile) || 
           (col < 14 && board[row][col + 1].tile);
  }

  /**
   * Generate word from specific position using GADDAG-style approach
   */
  private async generateWordFromPosition(
    board: BoardCell[][],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical',
    rackCounts: Map<string, number>,
    crossCheck: Set<string>,
    anchorPos: number,
    moves: ScrabbleMove[]
  ): Promise<void> {
    // Build word incrementally, checking constraints at each step
    const word: string[] = [];
    const tilesUsed: string[] = [];
    const usedRack = new Map(rackCounts);

    await this.buildWordRecursive(
      board, startRow, startCol, direction, word, tilesUsed, 
      usedRack, crossCheck, anchorPos, moves, 0
    );
  }

  /**
   * Recursively build word checking all constraints
   */
  private async buildWordRecursive(
    board: BoardCell[][],
    currentRow: number,
    currentCol: number,
    direction: 'horizontal' | 'vertical',
    word: string[],
    tilesUsed: string[],
    rackCounts: Map<string, number>,
    crossCheck: Set<string>,
    anchorPos: number,
    moves: ScrabbleMove[],
    position: number
  ): Promise<void> {
    // Check bounds
    if (currentRow < 0 || currentRow >= 15 || currentCol < 0 || currentCol >= 15) {
      return;
    }

    const currentCell = board[currentRow][currentCol];
    const isAnchorPosition = (direction === 'horizontal' && currentCol === anchorPos) ||
                            (direction === 'vertical' && currentRow === anchorPos);

    if (currentCell.tile) {
      // Existing tile on board - must use it
      word.push(currentCell.tile);
      
      // Continue building word
      await this.continueWordBuilding(
        board, currentRow, currentCol, direction, word, tilesUsed,
        rackCounts, crossCheck, anchorPos, moves, position + 1
      );
      
      word.pop(); // Backtrack
    } else {
      // Empty square - try placing tiles from rack
      const availableLetters = Array.from(rackCounts.keys()).filter(letter => 
        rackCounts.get(letter)! > 0
      );

      for (const letter of availableLetters) {
        // Check cross-check constraint for anchor position
        if (isAnchorPosition && !crossCheck.has(letter)) {
          continue;
        }

        // Check if this letter forms valid cross-words
        if (!this.isValidCrossPlacement(board, currentRow, currentCol, letter, direction)) {
          continue;
        }

        // Use tile from rack
        word.push(letter);
        tilesUsed.push(letter);
        rackCounts.set(letter, rackCounts.get(letter)! - 1);

        // Check if we have a valid word so far
        if (word.length >= 2 && this.isValidWordAtPosition(word, position, anchorPos)) {
          const wordStr = word.join('');
          if (this.isValidWord(wordStr)) {
            // Create and score the move
            const move = this.createMoveFromWordBuild(
              board, word, tilesUsed, 
              direction === 'horizontal' ? currentRow - position : currentRow - position,
              direction === 'horizontal' ? currentCol - position : currentCol - position,
              direction
            );
            if (move && move.score > 0) {
              moves.push(move);
            }
          }
        }

        // Continue building word if we have rack tiles left and board space
        if (this.canContinueBuilding(rackCounts) && word.length < 7) {
          await this.continueWordBuilding(
            board, currentRow, currentCol, direction, word, tilesUsed,
            rackCounts, crossCheck, anchorPos, moves, position + 1
          );
        }

        // Backtrack
        word.pop();
        tilesUsed.pop();
        rackCounts.set(letter, rackCounts.get(letter)! + 1);
      }
    }
  }

  /**
   * Continue building word to the next position
   */
  private async continueWordBuilding(
    board: BoardCell[][],
    currentRow: number,
    currentCol: number,
    direction: 'horizontal' | 'vertical',
    word: string[],
    tilesUsed: string[],
    rackCounts: Map<string, number>,
    crossCheck: Set<string>,
    anchorPos: number,
    moves: ScrabbleMove[],
    position: number
  ): Promise<void> {
    const nextRow = direction === 'horizontal' ? currentRow : currentRow + 1;
    const nextCol = direction === 'horizontal' ? currentCol + 1 : currentCol;

    await this.buildWordRecursive(
      board, nextRow, nextCol, direction, word, tilesUsed,
      rackCounts, crossCheck, anchorPos, moves, position
    );
  }

  /**
   * Check if we can continue building (have tiles left)
   */
  private canContinueBuilding(rackCounts: Map<string, number>): boolean {
    for (const count of rackCounts.values()) {
      if (count > 0) return true;
    }
    return false;
  }

  /**
   * Check if word is valid at current position relative to anchor
   */
  private isValidWordAtPosition(word: string[], position: number, anchorPos: number): boolean {
    // Word must include or pass through the anchor position
    const startPos = position - word.length + 1;
    const endPos = position;
    return startPos <= anchorPos && endPos >= anchorPos;
  }

  /**
   * Check if placing a letter creates valid cross-words
   */
  private isValidCrossPlacement(
    board: BoardCell[][],
    row: number,
    col: number,
    letter: string,
    direction: 'horizontal' | 'vertical'
  ): boolean {
    // Get perpendicular cross-word that would be formed
    const perpDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
    const crossWord = this.getCrossWord(board, row, col, perpDirection);
    
    if (crossWord === null) {
      return true; // No cross-word formed
    }

    const testWord = this.insertLetterInCrossWord(crossWord, letter);
    return this.isValidWord(testWord);
  }

  /**
   * Create move from word building process
   */
  private createMoveFromWordBuild(
    board: BoardCell[][],
    word: string[],
    tilesUsed: string[],
    startRow: number,
    startCol: number,
    direction: 'horizontal' | 'vertical'
  ): ScrabbleMove | null {
    const wordStr = word.join('');
    const score = this.calculateMoveScore(board, { row: startRow, col: startCol, direction, crossCheck: new Set() }, wordStr, tilesUsed);
    
    const tilesPlaced = tilesUsed.map((letter, index) => ({
      row: direction === 'horizontal' ? startRow : startRow + index,
      col: direction === 'horizontal' ? startCol + index : startCol,
      letter,
      isWildcard: letter === '?'
    }));

    return {
      word: wordStr,
      startRow,
      startCol,
      direction,
      tilesPlaced,
      score,
      crossWords: [] // TODO: Calculate cross-words
    };
  }

  /**
   * Generate all permutations of rack tiles up to specified length
   */
  private generateTileCombinations(
    rack: string[],
    length: number,
    wildcardCount: number
  ): string[][] {
    const results: string[][] = [];
    
    // Simple approach: generate all permutations of specified length
    this.generatePermutations(rack, length, [], results, new Set());
    
    return results;
  }

  /**
   * Generate permutations efficiently
   */
  private generatePermutations(
    rack: string[],
    targetLength: number,
    current: string[],
    results: string[][],
    used: Set<number>
  ): void {
    if (current.length === targetLength) {
      results.push([...current]);
      return;
    }

    if (results.length >= 1000) return; // Performance limit

    for (let i = 0; i < rack.length; i++) {
      if (used.has(i)) continue;
      
      used.add(i);
      current.push(rack[i]);
      this.generatePermutations(rack, targetLength, current, results, used);
      current.pop();
      used.delete(i);
    }
  }

  /**
   * Check if word can be placed at anchor position
   */
  private canPlaceWord(board: BoardCell[][], anchor: BoardAnchor, word: string): boolean {
    const { row, col, direction } = anchor;
    
    // Check bounds and conflicts
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'horizontal' ? row : row + i;
      const currentCol = direction === 'horizontal' ? col + i : col;
      
      if (currentRow >= 15 || currentCol >= 15 || currentRow < 0 || currentCol < 0) {
        return false; // Out of bounds
      }
      
      if (board[currentRow][currentCol].tile) {
        // Position already occupied
        if (board[currentRow][currentCol].tile !== word[i]) {
          return false; // Conflict
        }
      }
    }

    // For empty board, word must cross center (7,7)
    if (this.isBoardEmpty(board)) {
      const crossesCenter = this.wordCrossesCenter(anchor, word.length);
      if (!crossesCenter) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if board is empty
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
   * Check if word crosses the center (7,7)
   */
  private wordCrossesCenter(anchor: BoardAnchor, wordLength: number): boolean {
    const CENTER_ROW = 7;
    const CENTER_COL = 7;
    const { row, col, direction } = anchor;

    if (direction === 'horizontal') {
      const endCol = col + wordLength - 1;
      return row === CENTER_ROW && col <= CENTER_COL && endCol >= CENTER_COL;
    } else {
      const endRow = row + wordLength - 1;
      return col === CENTER_COL && row <= CENTER_ROW && endRow >= CENTER_ROW;
    }
  }

  /**
   * Create a move object with score calculation
   */
  private createMove(
    board: BoardCell[][],
    anchor: BoardAnchor,
    word: string,
    tiles: string[]
  ): ScrabbleMove | null {
    const score = this.calculateMoveScore(board, anchor, word, tiles);
    
    const tilesPlaced = tiles.map((letter, index) => ({
      row: anchor.direction === 'horizontal' ? anchor.row : anchor.row + index,
      col: anchor.direction === 'horizontal' ? anchor.col + index : anchor.col,
      letter,
      isWildcard: letter === '?'
    }));

    return {
      word,
      startRow: anchor.row,
      startCol: anchor.col,
      direction: anchor.direction,
      tilesPlaced,
      score,
      crossWords: [] // TODO: Calculate cross-words
    };
  }

  /**
   * Calculate complete move score including main word and all cross-words (Quackle-style)
   */
  private calculateMoveScore(
    board: BoardCell[][],
    anchor: BoardAnchor,
    word: string,
    tiles: string[]
  ): number {
    const BOARD_TEMPLATE = this.getBoardTemplate();
    let totalScore = 0;
    let mainWordMultiplier = 1;
    let mainWordScore = 0;
    let crossWordScores = 0;
    const newTilePositions: Array<{row: number, col: number, letter: string}> = [];

    // First pass: Calculate main word score and track new tile positions
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const letterScore = TileBagManager.getTileValue(letter);
      
      const currentRow = anchor.direction === 'horizontal' ? anchor.row : anchor.row + i;
      const currentCol = anchor.direction === 'horizontal' ? anchor.col + i : anchor.col;
      
      if (currentRow >= 15 || currentCol >= 15 || currentRow < 0 || currentCol < 0) continue;
      
      const cell = board[currentRow][currentCol];
      const cellType = BOARD_TEMPLATE[currentRow][currentCol];
      
      let letterMultiplier = 1;
      let isNewTile = !cell.tile;
      
      if (isNewTile) {
        newTilePositions.push({ row: currentRow, col: currentCol, letter });
        
        // Apply premium square multipliers for newly placed tiles
        switch (cellType) {
          case 'dl': 
            letterMultiplier = 2; 
            break;
          case 'tl': 
            letterMultiplier = 3; 
            break;
          case 'dw':
            mainWordMultiplier *= 2;
            break;
          case 'star': // Centro = doble palabra
            mainWordMultiplier *= 2;
            break;
          case 'tw': 
            mainWordMultiplier *= 3; 
            break;
        }
      }
      
      mainWordScore += letterScore * letterMultiplier;
    }

    // Apply word multiplier to main word
    totalScore += mainWordScore * mainWordMultiplier;

    // Second pass: Calculate cross-word scores
    for (const newTile of newTilePositions) {
      const crossWordScore = this.calculateCrossWordScore(
        board, newTile.row, newTile.col, newTile.letter, 
        anchor.direction, BOARD_TEMPLATE
      );
      crossWordScores += crossWordScore;
    }

    totalScore += crossWordScores;

    // Bonus for using all 7 tiles (bingo)
    if (tiles.length === 7) {
      totalScore += 50;
    }

    // Debug for high-scoring moves
    if (totalScore >= 50 || tiles.length >= 6) {
      console.log(`🎯 Score breakdown - Word: ${word}, Main: ${mainWordScore * mainWordMultiplier}, Cross: ${crossWordScores}, Total: ${totalScore}`);
    }
    
    return totalScore;
  }

  /**
   * Calculate score for cross-words formed by placing a single tile
   */
  private calculateCrossWordScore(
    board: BoardCell[][],
    row: number,
    col: number,
    newLetter: string,
    mainDirection: 'horizontal' | 'vertical',
    boardTemplate: string[][]
  ): number {
    const crossDirection = mainDirection === 'horizontal' ? 'vertical' : 'horizontal';
    
    // Get the complete cross-word that would be formed
    const crossWordInfo = this.getCompleteIntersectionWord(board, row, col, newLetter, crossDirection);
    
    if (!crossWordInfo || crossWordInfo.word.length < 2) {
      return 0; // No cross-word formed
    }

    let crossScore = 0;
    let crossWordMultiplier = 1;

    // Calculate cross-word score
    for (let i = 0; i < crossWordInfo.word.length; i++) {
      const letter = crossWordInfo.word[i];
      const letterScore = TileBagManager.getTileValue(letter);
      
      const letterRow = crossDirection === 'horizontal' ? crossWordInfo.startRow : crossWordInfo.startRow + i;
      const letterCol = crossDirection === 'horizontal' ? crossWordInfo.startCol + i : crossWordInfo.startCol;
      
      const cellType = boardTemplate[letterRow][letterCol];
      let letterMultiplier = 1;
      
      // Apply multipliers only for the newly placed tile
      if (letterRow === row && letterCol === col) {
        switch (cellType) {
          case 'dl': 
            letterMultiplier = 2; 
            break;
          case 'tl': 
            letterMultiplier = 3; 
            break;
          case 'dw':
            crossWordMultiplier *= 2;
            break;
          case 'star':
            crossWordMultiplier *= 2;
            break;
          case 'tw': 
            crossWordMultiplier *= 3; 
            break;
        }
      }
      
      crossScore += letterScore * letterMultiplier;
    }

    return crossScore * crossWordMultiplier;
  }

  /**
   * Get complete word formed by intersection including the new tile
   */
  private getCompleteIntersectionWord(
    board: BoardCell[][],
    row: number,
    col: number,
    newLetter: string,
    direction: 'horizontal' | 'vertical'
  ): { word: string; startRow: number; startCol: number } | null {
    let prefix = '';
    let suffix = '';
    let startRow = row;
    let startCol = col;

    if (direction === 'horizontal') {
      // Look left for prefix
      for (let c = col - 1; c >= 0; c--) {
        if (board[row][c].tile) {
          prefix = board[row][c].tile + prefix;
          startCol = c;
        } else {
          break;
        }
      }
      
      // Look right for suffix
      for (let c = col + 1; c < 15; c++) {
        if (board[row][c].tile) {
          suffix += board[row][c].tile;
        } else {
          break;
        }
      }
    } else {
      // Look up for prefix
      for (let r = row - 1; r >= 0; r--) {
        if (board[r][col].tile) {
          prefix = board[r][col].tile + prefix;
          startRow = r;
        } else {
          break;
        }
      }
      
      // Look down for suffix
      for (let r = row + 1; r < 15; r++) {
        if (board[r][col].tile) {
          suffix += board[r][col].tile;
        } else {
          break;
        }
      }
    }

    const completeWord = prefix + newLetter + suffix;
    
    if (completeWord.length < 2) {
      return null;
    }

    return {
      word: completeWord,
      startRow,
      startCol
    };
  }

  /**
   * Get board template for multiplier calculations
   */
  private getBoardTemplate() {
    return [
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
  }

  /**
   * Wait for word set to finish loading
   */
  private async waitForLoad(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (!this.isReady() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isReady()) {
      throw new Error('Word set failed to load within timeout');
    }
  }

  /**
   * Get word set statistics
   */
  public getStats(): any {
    return {
      isLoaded: this.isLoaded,
      wordCount: this.wordSet.size,
      metadata: this.wordMetadata
    };
  }
}

// Singleton instance
export const gaddagMoveGenerator = new GaddagMoveGenerator();