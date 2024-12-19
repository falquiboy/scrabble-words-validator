import { TrieNode, LengthIndexedTrie } from './trie/types';
import { createNode, findNode, collectWords } from './trie/nodeOperations';
import { createLengthIndex, findWordsByLength, findWordsByAlphagram } from './trie/indexing';
import { searchExact } from './trie/search';

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

  private dfs(node: TrieNode, words: string[]): void {
    collectWords(node, words);
  }

  private sortLetters(letters: string): string {
    return letters.split('').sort().join('');
  }
}

// Create a singleton instance
export const wordTrie = new Trie();