class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word: string;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.word = '';
  }
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string, originalWord: string): void {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = originalWord;
  }

  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  private findNode(word: string): TrieNode | null {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }
    
    return current;
  }

  // Helper method to get all words starting with a prefix
  getWordsStartingWith(prefix: string): Set<string> {
    const node = this.findNode(prefix);
    const words = new Set<string>();
    
    if (node) {
      this.collectWords(node, words);
    }
    
    return words;
  }

  private collectWords(node: TrieNode, words: Set<string>): void {
    if (node.isEndOfWord) {
      words.add(node.word);
    }

    for (const [, child] of node.children) {
      this.collectWords(child, words);
    }
  }

  // Helper method to get all valid words
  getAllWords(): string[] {
    const words: string[] = [];
    this.dfs(this.root, words);
    return words;
  }

  private dfs(node: TrieNode, words: string[]): void {
    if (node.isEndOfWord) {
      words.push(node.word);
    }

    for (const [, child] of node.children) {
      this.dfs(child, words);
    }
  }
}

// Create a singleton instance
export const wordTrie = new Trie();