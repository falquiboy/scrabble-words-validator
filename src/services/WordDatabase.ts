import { toast } from 'sonner';

const DB_NAME = 'scrabbleDB';
const DB_VERSION = 4; // Increment to force rebuild
const STORE_NAME = 'words';
const META_STORE = 'metadata';

export class WordDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(new Error('Failed to initialize IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        if (db.objectStoreNames.contains(META_STORE)) {
          db.deleteObjectStore(META_STORE);
        }

        db.createObjectStore(STORE_NAME, { keyPath: 'word' });
        const metaStore = db.createObjectStore(META_STORE, { keyPath: 'key' });
        metaStore.put({ key: 'version', value: DB_VERSION });
      };
    });
  }

  async addWords(words: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Failed to add words to database'));
      };

      transaction.oncomplete = () => resolve();

      words.forEach(word => {
        const upperWord = word.toUpperCase();
        store.put({ word: upperWord });
      });
    });
  }

  async getAllWords(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        console.error('GetAll error:', request.error);
        reject(new Error('Failed to retrieve words'));
      };

      request.onsuccess = () => {
        resolve(request.result.map(record => record.word));
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
}

export const wordDB = new WordDatabase();