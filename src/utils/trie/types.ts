
export interface Trie {
  getRoot: () => TrieNode;
  search: (word: string) => boolean;
  getWordsStartingWith: (prefix: string) => string[];
  getAllWords: () => string[];
}

export interface TrieNode {
  isEndOfWord: boolean;
  children: Map<string, TrieNode>;
  word: string;
  getAllWords?: () => string[];
}

export class TrieImplementation implements Trie {
  private root: TrieNode;

  constructor() {
    this.root = {
      isEndOfWord: false,
      children: new Map(),
      word: ''
    };
  }

  getRoot(): TrieNode {
    return this.root;
  }

  search(word: string): boolean {
    // Search functionality
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
    }
    
    return current.isEndOfWord;
  }

  getWordsStartingWith(prefix: string): string[] {
    let current = this.root;
    
    // Traverse to the node corresponding to the prefix
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }
    
    // Gather all words starting from this node
    const results: string[] = [];
    this.collectWords(current, results);
    return results;
  }

  private collectWords(node: TrieNode, results: string[]): void {
    if (node.isEndOfWord) {
      results.push(node.word);
    }
    
    for (const [_, child] of node.children) {
      this.collectWords(child, results);
    }
  }

  getAllWords(): string[] {
    const results: string[] = [];
    this.collectWords(this.root, results);
    return results;
  }
}
