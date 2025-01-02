import { TrieNode } from "./types";
import { processDigraphs } from "../digraphs";

export const search = (node: TrieNode, word: string): boolean => {
  // Process digraphs before searching
  const processedWord = processDigraphs(word);
  
  let current = node;
  for (const char of processedWord) {
    if (!current.children.has(char)) {
      return false;
    }
    current = current.children.get(char)!;
  }
  return current.isEndOfWord;
};