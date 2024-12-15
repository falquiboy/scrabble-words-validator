export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word: string;
}

export interface LengthIndexedTrie {
  [length: number]: {
    [alphagram: string]: string[];
  };
}