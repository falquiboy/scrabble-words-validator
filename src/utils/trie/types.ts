
export interface Trie {
  getRoot: () => TrieNode;
  search: (word: string) => boolean;
  getWordsStartingWith: (prefix: string) => string[];
  getAllWords: () => string[];
  findAnagrams: (alphagram: string) => string[];
}

export interface TrieNode {
  isEndOfWord: boolean;
  children: Map<string, TrieNode>;
  word: string;
}

// Add the missing interfaces that were referenced in errors
export interface LengthIndexedTrie {
  [length: number]: {
    [alphagram: string]: string[];
  };
}

export interface SerializedTrieNode {
  children: [string, SerializedTrieNode][];
  isEndOfWord: boolean;
  word: string;
}

export interface SerializedTrie {
  root: SerializedTrieNode;
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

  findAnagrams(alphagram: string): string[] {
    // Find words that are anagrams of the given alphagram
    const results: string[] = [];
    // This is a simplified implementation - in a real implementation,
    // we would use length and alphagram indexing for efficiency
    this.collectWords(this.root, results);
    return results.filter(word => {
      // This would be replaced with actual alphagram comparison logic
      return this.generateAlphagram(word) === alphagram;
    });
  }

  private generateAlphagram(word: string): string {
    return [...word].sort().join('');
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

// Add the getAllWords function for TrieNode to fix the prototype error
export const getAllWordsFromNode = (node: TrieNode): string[] => {
  const words: string[] = [];
  
  const collectWords = (currentNode: TrieNode) => {
    if (currentNode.isEndOfWord) {
      words.push(currentNode.word);
    }
    
    currentNode.children.forEach((childNode) => {
      collectWords(childNode);
    });
  };
  
  collectWords(node);
  return words;
};
