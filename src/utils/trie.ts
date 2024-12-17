import { TrieNode, LengthIndexedTrie } from './trie/types';
import { createNode, findNode, collectWords } from './trie/nodeOperations';
import { createLengthIndex, findWordsByLength, findWordsByAlphagram } from './trie/indexing';
import { searchExact, searchPattern } from './trie/search';

export class Trie {
  private root: TrieNode;
  private lengthIndex: LengthIndexedTrie;

  constructor() {
    this.root = createNode();
    this.lengthIndex = {};
  }

  clear(): void {
    this.root = createNode();
    this.lengthIndex = {};
  }

  insert(word: string, originalWord: string): void {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, createNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = originalWord;

    // Update length index
    const length = word.length;
    if (!this.lengthIndex[length]) {
      this.lengthIndex[length] = {};
    }
    
    const alphagram = this.sortLetters(word);
    if (!this.lengthIndex[length][alphagram]) {
      this.lengthIndex[length][alphagram] = [];
    }
    
    this.lengthIndex[length][alphagram].push(originalWord);
  }

  search(word: string): boolean {
    return searchExact(this.root, word);
  }

  findAnagrams(letters: string): string[] {
    const length = letters.length;
    const alphagram = this.sortLetters(letters);
    
    return findWordsByAlphagram(this.lengthIndex, length, alphagram);
  }

  getWordsOfLength(length: number): string[] {
    return findWordsByLength(this.lengthIndex, length);
  }

  getAllWords(): string[] {
    const words: string[] = [];
    this.dfs(this.root, words);
    return words;
  }

  getWordsStartingWith(prefix: string): string[] {
    const node = findNode(this.root, prefix);
    if (!node) return [];
    
    const words: string[] = [];
    if (node.isEndOfWord) {
      words.push(node.word);
    }
    
    collectWords(node, words);
    return words;
  }

  // New serialization methods
  serialize(): string {
    return JSON.stringify(this.serializeNode(this.root));
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.root = this.deserializeNode(parsed);
    this.rebuildLengthIndex();
  }

  private serializeNode(node: TrieNode): any {
    const serialized: any = {
      isEndOfWord: node.isEndOfWord,
      word: node.word,
      children: {}
    };

    node.children.forEach((childNode, char) => {
      serialized.children[char] = this.serializeNode(childNode);
    });

    return serialized;
  }

  private deserializeNode(data: any): TrieNode {
    const node = createNode();
    node.isEndOfWord = data.isEndOfWord;
    node.word = data.word;

    Object.entries(data.children).forEach(([char, childData]) => {
      node.children.set(char, this.deserializeNode(childData as any));
    });

    return node;
  }

  private rebuildLengthIndex(): void {
    this.lengthIndex = {};
    const words = this.getAllWords();
    
    words.forEach(word => {
      const length = word.length;
      const alphagram = this.sortLetters(word);
      
      if (!this.lengthIndex[length]) {
        this.lengthIndex[length] = {};
      }
      
      if (!this.lengthIndex[length][alphagram]) {
        this.lengthIndex[length][alphagram] = [];
      }
      
      this.lengthIndex[length][alphagram].push(word);
    });
  }

  private dfs(node: TrieNode, words: string[]): void {
    collectWords(node, words);
  }

  private sortLetters(letters: string): string {
    return letters.split('').sort().join('');
  }
}

// Create a singleton instance
export const wordTrie = new Trie();