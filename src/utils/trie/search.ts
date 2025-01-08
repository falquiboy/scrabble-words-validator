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

export const searchTrie = async (trie: TrieNode, pattern: RegExp, rackLetters: string = ''): Promise<string[]> => {
  const matches: string[] = [];
  
  const searchNode = (node: TrieNode, currentWord: string) => {
    if (node.isEndOfWord && pattern.test(currentWord)) {
      // If we have rack letters, validate them
      if (rackLetters) {
        const availableLetters = [...rackLetters.toUpperCase()];
        const wordLetters = [...currentWord];
        let isValid = true;
        
        for (const letter of wordLetters) {
          const index = availableLetters.indexOf(letter);
          if (index === -1) {
            isValid = false;
            break;
          }
          availableLetters.splice(index, 1);
        }
        
        if (isValid) {
          matches.push(node.word);
        }
      } else {
        matches.push(node.word);
      }
    }
    
    node.children.forEach((childNode, char) => {
      searchNode(childNode, currentWord + char);
    });
  };
  
  searchNode(trie, '');
  return matches;
};