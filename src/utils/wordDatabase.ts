import { processDigraphs, toDisplayFormat } from '@/utils/digraphs';

const DB_NAME = 'scrabbleDB';
const DB_VERSION = 2; // Updated from 1 to 2 to match existing DB version
const STORE_NAME = 'words';

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'word' });
          store.createIndex('processedWord', 'processedWord', { unique: true });
        }
      };
    });

    return this.initPromise;
  }

  async addWords(words: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

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
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const processedWordIndex = store.index('processedWord');
      const request = processedWordIndex.get(processDigraphs(word.toUpperCase()));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result !== undefined);
    });
  }

  async getAllWords(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
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
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getProcessedWords(): Promise<{ original: string; processed: string }[]> {
    await this.init(); // Ensure database is initialized
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
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
