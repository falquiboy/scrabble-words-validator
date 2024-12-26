export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word?: string;
}

export interface Trie {
  root: TrieNode;
  insert(word: string, value?: string): void;
  search(word: string): boolean;
  getAllWords(): string[];
  getWordsStartingWith(prefix: string): Set<string>;
  findAnagrams(alphagram: string): string[];
  clear(): void;
}