
import { TrieNode } from "./types";
import { processDigraphs } from "../digraphs";
import { validateWordPattern } from "../pattern/validation";

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
  const hasRackLetters = rackLetters && rackLetters.trim().length > 0;
  const patternStr = pattern.toString().slice(1, -1).replace(/^\^|\$$/g, '');
  
  console.log('Searching trie with:', { pattern: patternStr, rackLetters, hasRackLetters });
  
  const searchNode = (node: TrieNode, currentWord: string) => {
    if (node.isEndOfWord && pattern.test(currentWord)) {
      // If we have rack letters, validate them against the pattern and word
      if (hasRackLetters) {
        // For patterns with question marks, validate that we can build the word
        // using the available rack letters
        const isValidWithRack = validateWordPattern(currentWord, patternStr, rackLetters);
        if (isValidWithRack) {
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
