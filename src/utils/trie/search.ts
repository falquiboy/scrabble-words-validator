import { TrieNode } from "./types";
import { processDigraphs } from "../digraphs";

export const search = (node: TrieNode, word: string): boolean => {
  // Process digraphs before searching
  const processedWord = processDigraphs(word.toUpperCase());
  console.log('Searching for processed word:', processedWord);
  
  let current = node;
  for (const char of processedWord) {
    if (!current.children.has(char)) {
      console.log('Character not found in trie:', char);
      return false;
    }
    current = current.children.get(char)!;
  }
  
  const found = current.isEndOfWord;
  console.log('Word found in trie?', found);
  return found;
};