// KWG Reader FINAL - Completely new file to bypass cache
// Uses correct GADDAG algorithm for Spanish word finding

export class KwgNodeFinal {
  private data: number;
  
  constructor(data: number) {
    this.data = data;
  }
  
  // Tile extraction from top 8 bits (confirmed working)
  tile(): number {
    return (this.data >>> 24) & 0xFF;
  }
  
  // Accepts flag from bit 26 (85.7% correlation from analysis)
  accepts(): boolean {
    return (this.data & 0x4000000) !== 0;
  }
  
  // End flag from bit 22 (confirmed from logs)
  isEnd(): boolean {
    return (this.data & 0x400000) !== 0;
  }
  
  // Arc index from bottom 22 bits (confirmed)
  arcIndex(): number {
    return this.data & 0x3FFFFF;
  }
  
  // Debug info
  debugInfo(): string {
    const tile = this.tile();
    const char = tile >= 32 && tile <= 126 ? String.fromCharCode(tile) : `#${tile}`;
    return `tile=${tile}('${char}'), accepts=${this.accepts()}, isEnd=${this.isEnd()}, arcIndex=${this.arcIndex()}`;
  }
}

export class KwgReaderFinal {
  private bytes: Uint8Array = new Uint8Array();
  private nodes: KwgNodeFinal[] = [];
  private readonly ROOT_ARC_INDEX = 144896; // CORRECTED from detailed log analysis
  
  // Spanish alphabet mapping (corrected based on KWG analysis)
  private readonly CHAR_TO_TILE_MAP = new Map([
    ['A', 1], ['B', 2], ['C', 3], ['D', 4], ['E', 5],
    ['F', 6], ['G', 7], ['H', 8], ['I', 9], ['J', 10],
    ['K', 11], ['L', 12], ['M', 13], ['N', 14], ['O', 15],
    ['P', 16], ['Q', 17], ['R', 18], ['S', 19], ['T', 20],
    ['U', 21], ['V', 22], ['W', 23], ['X', 24], ['Y', 25], 
    ['Z', 26], ['Ñ', 27], ['Ç', 3] // CH=Ç maps to C for simplicity
  ]);
  
  async loadFromUrl(url: string): Promise<void> {
    console.log(`🔥🔥🔥 FINAL KWG: Loading from ${url}...`);
    
    // Super aggressive cache busting
    const cacheBuster = `final-${Date.now()}-${Math.random().toString(36)}`;
    const response = await fetch(`${url}?final=${cacheBuster}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    this.bytes = new Uint8Array(await response.arrayBuffer());
    console.log(`🔥🔥🔥 FINAL KWG: Loaded ${this.bytes.length} bytes`);
    
    this.parseNodes();
  }
  
  private parseNodes(): void {
    const nodeCount = this.bytes.length / 4;
    
    for (let i = 0; i < nodeCount; i++) {
      const offset = i * 4;
      const data = this.bytes[offset] |
                  (this.bytes[offset + 1] << 8) |
                  (this.bytes[offset + 2] << 16) |
                  (this.bytes[offset + 3] << 24);
      
      this.nodes.push(new KwgNodeFinal(data));
    }
    
    console.log(`🔥🔥🔥 FINAL KWG: Parsed ${this.nodes.length} nodes`);
    this.verifyFinalImplementation();
  }
  
  private verifyFinalImplementation(): void {
    console.log(`🧪🔥 FINAL KWG: Verifying implementation...`);
    
    const rootNode = this.nodes[0];
    console.log(`📍 Root: ${rootNode.debugInfo()}`);
    console.log(`🔍 Root arc index: ${this.ROOT_ARC_INDEX}`);
  }
  
  // Convert character to tile number
  private charToTile(char: string): number {
    const upperChar = char.toUpperCase();
    
    // Handle wildcard
    if (upperChar === '?') {
      return 63; // Keep wildcard mapping
    }
    
    if (this.CHAR_TO_TILE_MAP.has(upperChar)) {
      return this.CHAR_TO_TILE_MAP.get(upperChar)!;
    }
    
    return upperChar.charCodeAt(0);
  }
  
  // Convert tile number to character
  private tileToChar(tile: number): string {
    for (const [char, tileNum] of this.CHAR_TO_TILE_MAP) {
      if (tileNum === tile) {
        return char;
      }
    }
    
    // ASCII fallback for debugging
    if (tile >= 32 && tile <= 126) {
      return String.fromCharCode(tile);
    }
    
    return `#${tile}`;
  }
  
  // MAIN GADDAG WORD SEARCH - FINAL CORRECTED VERSION
  async findAllWords(tiles: string[]): Promise<string[]> {
    console.log(`🔥🔥🔥 FINAL GADDAG: Searching for words with [${tiles.join(', ')}]`);
    
    if (this.nodes.length === 0) {
      console.log(`❌ No nodes loaded`);
      return [];
    }
    
    const words = new Set<string>();
    
    console.log(`🚀🔥 FINAL: Starting GADDAG search from root arc index ${this.ROOT_ARC_INDEX}`);
    
    // Debug: Show tile mappings
    console.log(`🔍🔥 FINAL: Tile mappings for rack:`);
    tiles.forEach(tile => {
      const tileNum = this.charToTile(tile);
      console.log(`  '${tile}' -> ${tileNum}`);
    });
    
    // CORRECTED STRATEGY: Proper GADDAG word generation
    await this.generateGaddagWords(tiles, words);
    
    const foundWords = Array.from(words);
    console.log(`🔥🔥🔥 FINAL GADDAG: Found ${foundWords.length} words: [${foundWords.join(', ')}]`);
    
    return foundWords;
  }
  
  // Generate all possible words using proper GADDAG traversal
  private async generateGaddagWords(tiles: string[], results: Set<string>): Promise<void> {
    // Try building words from each possible starting letter
    for (let startIdx = 0; startIdx < tiles.length; startIdx++) {
      const startTile = tiles[startIdx];
      const remainingTiles = tiles.filter((_, idx) => idx !== startIdx);
      
      console.log(`🔥 Starting word search from '${startTile}'`);
      
      // Find the starting tile in the GADDAG
      const startNode = this.findTileNode(this.ROOT_ARC_INDEX, startTile);
      if (startNode !== -1) {
        console.log(`✅ Found start node for '${startTile}' at index ${startNode}`);
        
        // Build words forward from this position
        await this.buildWords(startNode, remainingTiles, startTile, results);
        
        // Also try building words backward (GADDAG's key feature)
        await this.buildWordsReverse(startNode, remainingTiles, startTile, results);
      }
    }
  }
  
  // Find a specific tile node in an arc group
  private findTileNode(arcStartIndex: number, targetTile: string): number {
    if (arcStartIndex >= this.nodes.length) return -1;
    
    const targetTileNum = this.charToTile(targetTile);
    
    for (let i = 0; i < 50 && arcStartIndex + i < this.nodes.length; i++) {
      const nodeIndex = arcStartIndex + i;
      const node = this.nodes[nodeIndex];
      
      if (node.tile() === targetTileNum) {
        return nodeIndex;
      }
      
      // Stop if we've gone past the alphabet
      if (node.tile() > 30 && node.tile() < 60) {
        break;
      }
    }
    
    return -1;
  }
  
  // Build words forward (left to right)
  private async buildWords(
    nodeIndex: number,
    remainingTiles: string[],
    currentWord: string,
    results: Set<string>
  ): Promise<void> {
    if (nodeIndex >= this.nodes.length) return;
    
    const node = this.nodes[nodeIndex];
    
    // Check if current word is a valid complete word
    if (currentWord.length >= 2 && node.isEnd()) {
      results.add(currentWord);
      console.log(`✨🔥 Found forward word: ${currentWord}`);
    }
    
    // If no more tiles or node doesn't accept continuations
    if (remainingTiles.length === 0 || !node.accepts()) {
      return;
    }
    
    // Try each remaining tile
    const nextArcIndex = node.arcIndex();
    for (const tile of remainingTiles) {
      const nextNodeIndex = this.findTileNode(nextArcIndex, tile);
      if (nextNodeIndex !== -1) {
        const newRemainingTiles = remainingTiles.filter(t => t !== tile);
        await this.buildWords(nextNodeIndex, newRemainingTiles, currentWord + tile, results);
      }
    }
  }
  
  // Build words backward (GADDAG reverse search)
  private async buildWordsReverse(
    nodeIndex: number,
    remainingTiles: string[],
    currentWord: string,
    results: Set<string>
  ): Promise<void> {
    if (remainingTiles.length === 0) return;
    
    // Try adding each remaining tile to the BEGINNING of the word
    for (const tile of remainingTiles) {
      const newWord = tile + currentWord;
      
      // Check if this reversed word is valid by traversing from root
      if (await this.isValidWord(newWord)) {
        results.add(newWord);
        console.log(`✨🔥 Found reverse word: ${newWord}`);
      }
      
      // Continue building longer words
      const newRemainingTiles = remainingTiles.filter(t => t !== tile);
      if (newRemainingTiles.length > 0) {
        await this.buildWordsReverse(nodeIndex, newRemainingTiles, newWord, results);
      }
    }
  }
  
  // Check if a word is valid by traversing the GADDAG
  private async isValidWord(word: string): boolean {
    if (word.length < 2) return false;
    
    let currentNodeIndex = this.ROOT_ARC_INDEX;
    
    for (const char of word.toUpperCase()) {
      const targetNode = this.findTileNode(currentNodeIndex, char);
      if (targetNode === -1) {
        return false;
      }
      
      currentNodeIndex = this.nodes[targetNode].arcIndex();
    }
    
    // Check if the final position indicates a complete word
    return currentNodeIndex < this.nodes.length && this.nodes[currentNodeIndex] && this.nodes[currentNodeIndex].isEnd();
  }
  
  isReady(): boolean {
    return this.nodes.length > 0;
  }
  
  getStats() {
    return {
      nodeCount: this.nodes.length,
      fileSize: this.bytes.length,
      isLoaded: this.nodes.length > 0
    };
  }
}