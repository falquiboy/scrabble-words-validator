// KWG Analyzer - Brand new file to bypass cache completely
// Systematic analysis of KWG format

export class KwgAnalyzerNode {
  private data: number;
  
  constructor(data: number) {
    this.data = data;
  }
  
  get rawData(): number {
    return this.data;
  }
  
  // Multiple interpretation methods
  tileTopBits(): number {
    return (this.data >>> 24) & 0xFF;
  }
  
  tileBotBits(): number {
    return this.data & 0xFF;
  }
  
  acceptsBit23(): boolean {
    return (this.data & 0x800000) !== 0;
  }
  
  isEndBit22(): boolean {
    return (this.data & 0x400000) !== 0;
  }
  
  arcIndex(): number {
    return this.data & 0x3FFFFF;
  }
}

export class KwgAnalyzer {
  private bytes: Uint8Array = new Uint8Array();
  private nodes: KwgAnalyzerNode[] = [];
  
  async loadFromUrl(url: string): Promise<void> {
    console.log(`🔥🔥🔥 KWG ANALYZER: Loading from ${url}...`);
    console.log(`🔥🔥🔥 THIS IS A COMPLETELY NEW FILE - NO CACHE!`);
    
    // Super aggressive cache busting
    const timestamp = Date.now();
    const random = Math.random().toString(36);
    const cacheBustedUrl = `${url}?bust=${timestamp}&r=${random}`;
    
    console.log(`🔥 Using aggressive cache-busted URL: ${cacheBustedUrl}`);
    
    const response = await fetch(cacheBustedUrl, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    this.bytes = new Uint8Array(await response.arrayBuffer());
    
    console.log(`🔥🔥🔥 KWG ANALYZER: Loaded ${this.bytes.length} bytes`);
    
    this.analyzeStructure();
  }
  
  private analyzeStructure(): void {
    const nodeCount = this.bytes.length / 4;
    
    console.log(`🔥🔥🔥 KWG ANALYZER: Parsing ${nodeCount} nodes...`);
    
    for (let i = 0; i < nodeCount; i++) {
      const offset = i * 4;
      const data = this.bytes[offset] |
                  (this.bytes[offset + 1] << 8) |
                  (this.bytes[offset + 2] << 16) |
                  (this.bytes[offset + 3] << 24);
      
      this.nodes.push(new KwgAnalyzerNode(data));
    }
    
    console.log(`🔥🔥🔥 KWG ANALYZER: Created ${this.nodes.length} nodes`);
    
    // SYSTEMATIC ANALYSIS
    this.performSystematicAnalysis();
  }
  
  private performSystematicAnalysis(): void {
    console.log(`🔥🔥🔥 KWG ANALYZER: SYSTEMATIC ANALYSIS STARTING`);
    console.log(`==========================================`);
    
    // Analyze first 10 nodes in detail
    for (let i = 0; i < Math.min(10, this.nodes.length); i++) {
      const node = this.nodes[i];
      const data = node.rawData;
      
      console.log(`🔍 ANALYZER Node [${i}]:`);
      console.log(`  Data: 0x${data.toString(16).padStart(8, '0')}`);
      console.log(`  Binary: ${data.toString(2).padStart(32, '0')}`);
      
      // Test all tile extraction methods
      const tileTop = node.tileTopBits();
      const tileBot = node.tileBotBits();
      const tileMidH = (data >>> 16) & 0xFF;
      const tileMidL = (data >>> 8) & 0xFF;
      
      console.log(`  Tile extractions:`);
      console.log(`    Top 8 bits: ${tileTop} ${tileTop >= 32 && tileTop <= 126 ? `'${String.fromCharCode(tileTop)}'` : ''}`);
      console.log(`    Bot 8 bits: ${tileBot} ${tileBot >= 32 && tileBot <= 126 ? `'${String.fromCharCode(tileBot)}'` : ''}`);
      console.log(`    Mid-high 8: ${tileMidH} ${tileMidH >= 32 && tileMidH <= 126 ? `'${String.fromCharCode(tileMidH)}'` : ''}`);
      console.log(`    Mid-low 8:  ${tileMidL} ${tileMidL >= 32 && tileMidL <= 126 ? `'${String.fromCharCode(tileMidL)}'` : ''}`);
      
      // Test flag interpretations
      console.log(`  Flag tests:`);
      console.log(`    Bit 23 (accepts): ${node.acceptsBit23()}`);
      console.log(`    Bit 22 (isEnd):   ${node.isEndBit22()}`);
      console.log(`    Arc index:        ${node.arcIndex()}`);
      
      console.log(`  ---`);
    }
    
    // Root analysis
    const rootNode = this.nodes[0];
    const rootArcIndex = rootNode.arcIndex();
    
    console.log(`🎯 ANALYZER ROOT ANALYSIS:`);
    console.log(`  Root arc index: ${rootArcIndex}`);
    
    if (rootArcIndex < this.nodes.length && rootArcIndex > 0) {
      console.log(`  Checking nodes at root arc index:`);
      for (let i = 0; i < Math.min(5, this.nodes.length - rootArcIndex); i++) {
        const arcNode = this.nodes[rootArcIndex + i];
        const tileTop = arcNode.tileTopBits();
        const char = tileTop >= 32 && tileTop <= 126 ? String.fromCharCode(tileTop) : `#${tileTop}`;
        console.log(`    [${rootArcIndex + i}]: tile=${tileTop} '${char}', accepts=${arcNode.acceptsBit23()}`);
      }
    }
    
    console.log(`🔥🔥🔥 KWG ANALYZER: ANALYSIS COMPLETE`);
  }
  
  async findWordsTest(tiles: string[]): Promise<string[]> {
    console.log(`🔥🔥🔥 ANALYZER: Testing word search with tiles [${tiles.join(', ')}]`);
    
    // Simple test - try to form basic words
    const testWords = ['TAB', 'BUT', 'NET', 'TEN'];
    const foundWords: string[] = [];
    
    for (const word of testWords) {
      if (this.canFormWord(word, tiles)) {
        console.log(`✅ ANALYZER: Can form '${word}'`);
        foundWords.push(word);
      } else {
        console.log(`❌ ANALYZER: Cannot form '${word}'`);
      }
    }
    
    console.log(`🔥 ANALYZER: Found ${foundWords.length} words: [${foundWords.join(', ')}]`);
    return foundWords;
  }
  
  private canFormWord(word: string, tiles: string[]): boolean {
    const wordLetters = word.toLowerCase().split('');
    const availableTiles = tiles.map(t => t.toLowerCase());
    
    for (const letter of wordLetters) {
      const index = availableTiles.indexOf(letter);
      if (index === -1) return false;
      availableTiles.splice(index, 1);
    }
    
    return true;
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