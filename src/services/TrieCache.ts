
import { SerializedTrie } from '@/utils/trie/types';
import { Trie } from '@/utils/trie';

class TrieCache {
  private static instance: TrieCache;
  private cachedTrie: Trie | null = null;
  private serializedTrie: SerializedTrie | null = null;
  private isInitializing = false;
  private initPromise: Promise<Trie> | null = null;

  private constructor() {}

  static getInstance(): TrieCache {
    if (!TrieCache.instance) {
      TrieCache.instance = new TrieCache();
    }
    return TrieCache.instance;
  }

  async getTrie(): Promise<Trie> {
    if (this.cachedTrie) {
      console.log('Using cached trie instance');
      return this.cachedTrie;
    }

    if (this.initPromise) {
      console.log('Waiting for existing trie initialization...');
      return this.initPromise;
    }

    this.initPromise = this.initializeTrie();
    return this.initPromise;
  }

  private async initializeTrie(): Promise<Trie> {
    try {
      if (!this.cachedTrie) {
        const trie = new Trie();
        if (this.serializedTrie) {
          console.log('Deserializing cached trie data...');
          trie.deserialize(this.serializedTrie);
        }
        this.cachedTrie = trie;
      }
      return this.cachedTrie;
    } finally {
      this.initPromise = null;
    }
  }

  setSerializedTrie(serializedTrie: SerializedTrie) {
    this.serializedTrie = serializedTrie;
    this.cachedTrie = null; // Force re-initialization with new data
  }

  clear() {
    this.cachedTrie = null;
    this.serializedTrie = null;
    this.initPromise = null;
  }
}

export const trieCache = TrieCache.getInstance();
