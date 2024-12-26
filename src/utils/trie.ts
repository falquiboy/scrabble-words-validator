import { TrieNode, Trie as TrieInterface } from './trie/types';
import { createNode, findNode, collectWords } from './trie/nodeOperations';
import { generateAlphagram, processDigraphs } from './digraphs';

export class Trie implements TrieInterface {
  root: TrieNode;

  constructor() {
    this.root = createNode();
  }

  insert(word: string) {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, createNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = word;
  }

  search(word: string): boolean {
    const node = findNode(this.root, word);
    return node?.isEndOfWord || false;
  }

  getAllWords(): string[] {
    const words: string[] = [];
    collectWords(this.root, words);
    return words;
  }

  getWordsStartingWith(prefix: string): Set<string> {
    const node = findNode(this.root, prefix);
    if (!node) return new Set();
    
    const words: string[] = [];
    collectWords(node, words);
    return new Set(words);
  }

  findAnagrams(alphagram: string): string[] {
    return this.getAllWords().filter(word => {
      const wordAlphagram = generateAlphagram(processDigraphs(word));
      return wordAlphagram === alphagram;
    });
  }
}