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

  clear(): void {
    this.root = new TrieNode();
  }

  insert(word: string, originalWord: string): void {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = originalWord;
  }

  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  private findNode(word: string): TrieNode | null {
    let current = this.root;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }
    
    return current;
  }

  // New method to find exact anagrams
  findAnagrams(letters: string): string[] {
    const sortedLetters = this.sortLetters(letters);
    return this.findAnagramsHelper(this.root, sortedLetters);
  }

  // New method to find wildcard matches
  findWildcardMatches(letters: string, wildcardCount: number): string[] {
    const results = new Set<string>();
    const lettersArray = letters.replace(/\*/g, '').split('');
    this.findWildcardMatchesHelper(this.root, lettersArray, wildcardCount, '', results);
    return Array.from(results);
  }

  // New method to get all words of a specific length
  getWordsOfLength(length: number): string[] {
    const words: string[] = [];
    this.dfsWithLength(this.root, words, length);
    return words;
  }

  private dfsWithLength(node: TrieNode, words: string[], targetLength: number): void {
    if (node.isEndOfWord && node.word.length === targetLength) {
      words.push(node.word);
    }

    for (const [, child] of node.children) {
      this.dfsWithLength(child, words, targetLength);
    }
  }

  // Helper method to sort letters consistently
  private sortLetters(letters: string): string {
    return letters.split('').sort().join('');
  }

  // Helper method for anagram search
  private findAnagramsHelper(node: TrieNode, remainingLetters: string): string[] {
    const results: string[] = [];
    
    if (remainingLetters.length === 0 && node.isEndOfWord) {
      results.push(node.word);
    }

    // Get frequency map of remaining letters
    const freqMap = new Map<string, number>();
    for (const char of remainingLetters) {
      freqMap.set(char, (freqMap.get(char) || 0) + 1);
    }

    // Try each remaining letter
    for (const [char, childNode] of node.children) {
      if (freqMap.has(char) && freqMap.get(char)! > 0) {
        // Use the letter
        freqMap.set(char, freqMap.get(char)! - 1);
        const newRemaining = this.mapToString(freqMap);
        results.push(...this.findAnagramsHelper(childNode, newRemaining));
        // Restore the letter for backtracking
        freqMap.set(char, freqMap.get(char)! + 1);
      }
    }

    return results;
  }

  // Helper method for wildcard matches
  private findWildcardMatchesHelper(
    node: TrieNode,
    letters: string[],
    wildcardCount: number,
    current: string,
    results: Set<string>
  ): void {
    if (node.isEndOfWord) {
      results.add(node.word);
      return;
    }

    // Try each possible next letter
    for (const [char, childNode] of node.children) {
      // Case 1: Use a letter from our set
      const letterIndex = letters.indexOf(char);
      if (letterIndex !== -1) {
        const newLetters = [...letters];
        newLetters.splice(letterIndex, 1);
        this.findWildcardMatchesHelper(
          childNode,
          newLetters,
          wildcardCount,
          current + char,
          results
        );
      }
      
      // Case 2: Use a wildcard if available
      if (wildcardCount > 0) {
        this.findWildcardMatchesHelper(
          childNode,
          letters,
          wildcardCount - 1,
          current + char,
          results
        );
      }
    }
  }

  // Helper method to convert frequency map back to string
  private mapToString(freqMap: Map<string, number>): string {
    let result = '';
    for (const [char, count] of freqMap) {
      result += char.repeat(count);
    }
    return result;
  }

  // Helper method to get all valid words
  getAllWords(): string[] {
    const words: string[] = [];
    this.dfs(this.root, words);
    return words;
  }

  private dfs(node: TrieNode, words: string[]): void {
    if (node.isEndOfWord) {
      words.push(node.word);
    }

    for (const [, child] of node.children) {
      this.dfs(child, words);
    }
  }

  getWordsStartingWith(prefix: string): string[] {
    const node = this.findNode(prefix);
    if (!node) return [];
    
    const words: string[] = [];
    if (node.isEndOfWord) {
      words.push(node.word);
    }
    
    this.collectWords(node, words);
    return words;
  }

  private collectWords(node: TrieNode, words: string[]): void {
    for (const [, child] of node.children) {
      if (child.isEndOfWord) {
        words.push(child.word);
      }
      this.collectWords(child, words);
    }
  }
}

// Create a singleton instance
export const wordTrie = new Trie();
