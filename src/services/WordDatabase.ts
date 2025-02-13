import { SerializedTrie, TrieNode } from '@/utils/trie/types';
import { TOTAL_WORDS } from '@/utils/dictionaryConstants';

const INTEGRITY_CHECK_KEY = 'dictionary_integrity';
const INTEGRITY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface IntegrityMetadata {
  wordCount: number;
  lastChecked: number;
  isComplete: boolean;
}

export class WordDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('scrabbleDB', 5);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        this.initPromise = null;
        reject(new Error('Failed to initialize IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (db.objectStoreNames.contains('words')) {
          db.deleteObjectStore('words');
        }
        if (db.objectStoreNames.contains('metadata')) {
          db.deleteObjectStore('metadata');
        }
        if (db.objectStoreNames.contains('trie')) {
          db.deleteObjectStore('trie');
        }

        db.createObjectStore('words', { keyPath: 'word' });
        db.createObjectStore('trie', { keyPath: 'id' });
        const metaStore = db.createObjectStore('metadata', { keyPath: 'key' });
        metaStore.put({ key: 'version', value: 5 });
      };
    });

    return this.initPromise;
  }

  private async getQuickIntegrityStatus(): Promise<IntegrityMetadata | null> {
    const cached = localStorage.getItem(INTEGRITY_CHECK_KEY);
    if (cached) {
      const metadata: IntegrityMetadata = JSON.parse(cached);
      const isRecent = Date.now() - metadata.lastChecked < INTEGRITY_CHECK_INTERVAL;
      if (isRecent) {
        return metadata;
      }
    }
    return null;
  }

  private async updateIntegrityStatus(metadata: IntegrityMetadata): Promise<void> {
    localStorage.setItem(INTEGRITY_CHECK_KEY, JSON.stringify(metadata));
  }

  async getDictionaryStatus(): Promise<{ isComplete: boolean; wordCount: number }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    // Try to get cached status first
    const quickStatus = await this.getQuickIntegrityStatus();
    if (quickStatus) {
      return {
        isComplete: quickStatus.isComplete,
        wordCount: quickStatus.wordCount
      };
    }

    // If no cached status or it's stale, do a quick count check
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('words', 'readonly');
      const store = transaction.objectStore('words');
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const wordCount = countRequest.result;
        const isComplete = wordCount >= TOTAL_WORDS;
        
        // Update integrity metadata
        const metadata: IntegrityMetadata = {
          wordCount,
          lastChecked: Date.now(),
          isComplete
        };
        this.updateIntegrityStatus(metadata);

        resolve({ isComplete, wordCount });
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  async addWords(words: string[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('words', 'readwrite');
      const store = transaction.objectStore('words');

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };

      transaction.oncomplete = () => resolve();

      words.forEach(word => {
        // Store the word as-is, without processing digraphs
        store.put({ word: word.toUpperCase() });
      });
    });
  }

  async getAllWords(): Promise<string[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('words', 'readonly');
      const store = transaction.objectStore('words');
      const request = store.getAll();

      request.onerror = () => {
        console.error('GetAll error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const words = request.result.map(record => record.word);
        // Update integrity metadata after successful retrieval
        const metadata: IntegrityMetadata = {
          wordCount: words.length,
          lastChecked: Date.now(),
          isComplete: words.length >= TOTAL_WORDS
        };
        this.updateIntegrityStatus(metadata);
        resolve(words);
      };
    });
  }

  async saveTrie(serializedTrie: SerializedTrie): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('trie', 'readwrite');
      const store = transaction.objectStore('trie');
      const request = store.put({ id: 'main', data: serializedTrie });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async loadTrie(): Promise<SerializedTrie | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('trie', 'readonly');
      const store = transaction.objectStore('trie');
      const request = store.get('main');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data || null);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['words', 'trie'], 'readwrite');
      const wordsStore = transaction.objectStore('words');
      const trieStore = transaction.objectStore('trie');

      wordsStore.clear();
      trieStore.clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        // Update integrity metadata after clearing
        const metadata: IntegrityMetadata = {
          wordCount: 0,
          lastChecked: Date.now(),
          isComplete: false
        };
        this.updateIntegrityStatus(metadata);
        resolve();
      };
    });
  }
}

export const wordDB = new WordDatabase();
