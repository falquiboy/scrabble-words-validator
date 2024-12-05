import { supabase } from "@/integrations/supabase/client";

class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word: string;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.word = '';
  }
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let current = this.root;
    const sortedWord = this.sortWord(word);
    
    for (const char of sortedWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = word; // Store the original unsorted word
  }

  private sortWord(word: string): string {
    return word.split('').sort().join('');
  }

  search(letters: string, minLength: number = 2): string[] {
    const results: string[] = [];
    const sortedLetters = this.sortWord(letters);
    
    const searchRecursive = (node: TrieNode, remainingLetters: string, usedLetters: string) => {
      if (usedLetters.length >= minLength && node.isEndOfWord) {
        results.push(node.word);
      }

      for (let i = 0; i < remainingLetters.length; i++) {
        const char = remainingLetters[i];
        if (node.children.has(char)) {
          const nextNode = node.children.get(char)!;
          const nextRemaining = remainingLetters.slice(0, i) + remainingLetters.slice(i + 1);
          searchRecursive(nextNode, nextRemaining, usedLetters + char);
        }
      }
    };

    searchRecursive(this.root, sortedLetters, '');
    return results;
  }

  searchWithWildcards(letters: string, wildcardCount: number = 0): string[] {
    const results: Set<string> = new Set();
    const sortedLetters = this.sortWord(letters.replace(/\*/g, ''));
    
    const searchRecursive = (node: TrieNode, remainingLetters: string, wildcards: number, usedLetters: string) => {
      if (node.isEndOfWord) {
        results.add(node.word);
      }

      // Use regular letters
      for (let i = 0; i < remainingLetters.length; i++) {
        const char = remainingLetters[i];
        if (node.children.has(char)) {
          const nextNode = node.children.get(char)!;
          const nextRemaining = remainingLetters.slice(0, i) + remainingLetters.slice(i + 1);
          searchRecursive(nextNode, nextRemaining, wildcards, usedLetters + char);
        }
      }

      // Use wildcards
      if (wildcards > 0) {
        for (const [char, nextNode] of node.children) {
          if (!remainingLetters.includes(char)) {
            searchRecursive(nextNode, remainingLetters, wildcards - 1, usedLetters + '*');
          }
        }
      }
    };

    searchRecursive(this.root, sortedLetters, wildcardCount, '');
    return Array.from(results);
  }
}

// Create and export a singleton instance
export const wordTrie = new Trie();

// Initialize the trie with words from Supabase
export const initializeTrie = async () => {
  const { data: words, error } = await supabase
    .from('words')
    .select('word');

  if (error) {
    console.error('Error fetching words:', error);
    return;
  }

  console.log(`Initializing trie with ${words.length} words...`);
  for (const { word } of words) {
    wordTrie.insert(word);
  }
  console.log('Trie initialization complete');
};