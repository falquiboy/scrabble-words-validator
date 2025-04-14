
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

/**
 * Searches the trie for words matching a pattern and optional rack letters
 */
export const searchTrie = async (trie: TrieNode, pattern: RegExp, rackLetters: string = ''): Promise<string[]> => {
  const matches: string[] = [];
  const hasRackLetters = rackLetters && rackLetters.trim().length > 0;
  const patternStr = pattern.toString().slice(1, -1).replace(/^\^|\$$/g, '');
  
  console.log('Searching trie with:', { pattern: patternStr, rackLetters, hasRackLetters });
  
  // This function recursively searches the trie and collects matching words
  const searchNode = (node: TrieNode, currentWord: string) => {
    // If this node is the end of a word, check if it matches the pattern
    if (node.isEndOfWord) {
      // The match must be tested against the processed word
      // Note: Since the pattern is already processed for digraphs,
      // we're correctly comparing processed to processed
      if (pattern.test(currentWord)) {
        // If we have rack letters, validate them against the pattern and word
        if (hasRackLetters) {
          // For patterns with rack letters, validate that we can build the word
          // using only the available rack letters
          const isValidWithRack = validateWordPattern(currentWord, patternStr, rackLetters);
          if (isValidWithRack) {
            matches.push(node.word);
            console.log(`Found valid match with rack: ${node.word}`);
          } else {
            console.log(`Word ${node.word} matches pattern but can't be formed with rack ${rackLetters}`);
          }
        } else {
          matches.push(node.word);
        }
      }
    }
    
    // Continue searching through all children of this node
    node.children.forEach((childNode, char) => {
      searchNode(childNode, currentWord + char);
    });
  };
  
  searchNode(trie, '');
  console.log(`Found ${matches.length} matches for pattern ${patternStr} with rack ${rackLetters}`);
  return matches;
};

/**
 * Helper function to get all words from a trie node
 * Used for pattern searches that need to check all words
 */
TrieNode.prototype.getAllWords = function(): string[] {
  const words: string[] = [];
  
  const collectWords = (node: TrieNode) => {
    if (node.isEndOfWord) {
      words.push(node.word);
    }
    
    node.children.forEach((childNode) => {
      collectWords(childNode);
    });
  };
  
  collectWords(this);
  return words;
};
