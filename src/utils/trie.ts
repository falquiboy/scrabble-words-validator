import { TrieNode, LengthIndexedTrie } from './trie/types';
import { createNode, findNode, collectWords } from './trie/nodeOperations';
import { createLengthIndex, findWordsByLength, findWordsByAlphagram } from './trie/indexing';
import { searchExact, searchPattern } from './trie/search';
import { processDigraphs, toDisplayFormat, generateAlphagram } from './digraphs';

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
    const processedWord = processDigraphs(word);
    let current = this.root;
    
    for (const char of processedWord) {
      if (!current.children.has(char)) {
        current.children.set(char, createNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = originalWord;

    // Update length index
    const length = processedWord.length;
    if (!this.lengthIndex[length]) {
      this.lengthIndex[length] = {};
    }
    
    const alphagram = generateAlphagram(processedWord);
    if (!this.lengthIndex[length][alphagram]) {
      this.lengthIndex[length][alphagram] = [];
    }
    
    this.lengthIndex[length][alphagram].push(originalWord);
  }

  search(word: string): boolean {
    return searchExact(this.root, word);
  }

  findAnagrams(letters: string): string[] {
    const processedLetters = processDigraphs(letters);
    const length = processedLetters.length;
    const alphagram = generateAlphagram(processedLetters);
    
    return findWordsByAlphagram(this.lengthIndex, length, alphagram)
      .map(word => toDisplayFormat(word));
  }

  getWordsOfLength(length: number): string[] {
    return findWordsByLength(this.lengthIndex, length)
      .map(word => toDisplayFormat(word));
  }

  getAllWords(): string[] {
    const words: string[] = [];
    this.dfs(this.root, words);
    return words.map(word => toDisplayFormat(word));
  }

  getWordsStartingWith(prefix: string): string[] {
    const processedPrefix = processDigraphs(prefix);
    const node = findNode(this.root, processedPrefix);
    if (!node) return [];
    
    const words: string[] = [];
    if (node.isEndOfWord) {
      words.push(node.word);
    }
    
    collectWords(node, words);
    return words.map(word => toDisplayFormat(word));
  }

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
      const processedWord = processDigraphs(word);
      const length = processedWord.length;
      const alphagram = generateAlphagram(processedWord);
      
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
}

// Create a singleton instance
export const wordTrie = new Trie();