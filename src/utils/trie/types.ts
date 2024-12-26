export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word: string;
}

export interface Trie {
  root: TrieNode;
  insert: (word: string) => void;
  search: (word: string) => boolean;
  getAllWords: () => string[];
  getWordsStartingWith: (prefix: string) => Set<string>;
  findAnagrams: (alphagram: string) => string[];
}

export interface LengthIndexedTrie {
  [length: number]: {
    [alphagram: string]: string[];
  };
}