/**
 * Web Worker para construcción no-bloqueante del Trie
 * Permite que la UI siga funcionando mientras se construye
 */

// Simple Trie implementation para el worker
class WorkerTrie {
  constructor() {
    this.root = { children: new Map(), isEndOfWord: false, word: null };
  }

  insert(word, originalWord) {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, { children: new Map(), isEndOfWord: false, word: null });
      }
      current = current.children.get(char);
    }
    
    current.isEndOfWord = true;
    current.word = originalWord;
  }

  serialize() {
    return {
      root: this.serializeNode(this.root)
    };
  }

  serializeNode(node) {
    return {
      children: Array.from(node.children.entries()).map(([key, value]) => [
        key,
        this.serializeNode(value),
      ]),
      isEndOfWord: node.isEndOfWord,
      word: node.word,
    };
  }
}

// Worker message handler
self.onmessage = async function(e) {
  const { type, words } = e.data;
  
  if (type === 'BUILD_TRIE') {
    try {
      console.log('🔧 Worker: Starting Trie construction with', words.length, 'words');

      const trie = new WorkerTrie();
      const totalWords = words.length;
      let processed = 0;

      // Build trie with progress reports
      for (const word of words) {
        const upperWord = word.toUpperCase();
        trie.insert(upperWord, upperWord);
        processed++;

        // Report progress every 5000 words to avoid spam
        if (processed % 5000 === 0 || processed === totalWords) {
          const progress = Math.floor((processed / totalWords) * 100);
          self.postMessage({
            type: 'PROGRESS',
            progress,
            processed,
            total: totalWords
          });
        }
      }

      console.log('✅ Worker: Trie construction complete, serializing...');

      self.postMessage({
        type: 'COMPLETE',
        serializedTrie: trie.serialize(),
        wordCount: totalWords
      });

      console.log('🚀 Worker: Trie sent to main thread');
      self.close();
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        message: error instanceof Error ? error.message : String(error)
      });
      self.close();
    }
  }
};

console.log('👷 Trie Builder Worker ready');
