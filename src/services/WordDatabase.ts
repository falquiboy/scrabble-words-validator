import { processDigraphs, toDisplayFormat } from '@/utils/digraphs';

export class WordDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('scrabbleDB', 4);

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

        db.createObjectStore('words', { keyPath: 'word' });
        const metaStore = db.createObjectStore('metadata', { keyPath: 'key' });
        metaStore.put({ key: 'version', value: 4 });
      };
    });

    return this.initPromise;
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

      // Process words with digraphs before storing
      words.forEach(word => {
        const processedWord = processDigraphs(word.toUpperCase());
        store.put({ word: processedWord });
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
        // Convert internal format back to display format when retrieving
        const words = request.result.map(record => toDisplayFormat(record.word));
        resolve(words);
      };
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('words', 'readwrite');
      const store = transaction.objectStore('words');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export a singleton instance
export const wordDB = new WordDatabase();