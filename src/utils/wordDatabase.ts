import { processDigraphs, toDisplayFormat } from '@/utils/digraphs';
import { wordTrie } from './trie';

const DB_NAME = 'scrabbleDB';
const DB_VERSION = 2; // Increased version to handle new store
const WORDS_STORE = 'words';
const TRIE_STORE = 'trie';

export class WordDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create or update words store
        if (!db.objectStoreNames.contains(WORDS_STORE)) {
          const store = db.createObjectStore(WORDS_STORE, { keyPath: 'word' });
          store.createIndex('processedWord', 'processedWord', { unique: true });
        }

        // Create trie store
        if (!db.objectStoreNames.contains(TRIE_STORE)) {
          db.createObjectStore(TRIE_STORE, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  async getStoredTrie(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(TRIE_STORE, 'readonly');
      const store = transaction.objectStore(TRIE_STORE);
      const request = store.get('main');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
    });
  }

  async storeTrie(serializedTrie: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(TRIE_STORE, 'readwrite');
      const store = transaction.objectStore(TRIE_STORE);
      const request = store.put({ id: 'main', data: serializedTrie });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addWords(words: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(WORDS_STORE, 'readwrite');
      const store = transaction.objectStore(WORDS_STORE);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      words.forEach(word => {
        const upperWord = word.toUpperCase();
        store.put({
          word: upperWord,
          processedWord: processDigraphs(upperWord)
        });
      });
    });
  }

  async hasWord(word: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(WORDS_STORE, 'readonly');
      const store = transaction.objectStore(WORDS_STORE);
      const processedWordIndex = store.index('processedWord');
      const request = processedWordIndex.get(processDigraphs(word.toUpperCase()));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result !== undefined);
    });
  }

  async getAllWords(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(WORDS_STORE, 'readonly');
      const store = transaction.objectStore(WORDS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Return the display format of the words
        resolve(request.result.map(record => toDisplayFormat(record.word)));
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(WORDS_STORE, 'readwrite');
      const store = transaction.objectStore(WORDS_STORE);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getProcessedWords(): Promise<{ original: string; processed: string }[]> {
    await this.init(); // Ensure database is initialized
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(WORDS_STORE, 'readonly');
      const store = transaction.objectStore(WORDS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map(record => ({
          original: record.word,
          processed: record.processedWord
        })));
      };
    });
  }
}

export const wordDB = new WordDatabase();
