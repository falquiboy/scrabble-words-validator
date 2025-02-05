import { SerializedTrie, TrieNode } from '@/utils/trie/types';

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
        const upperWord = word.toUpperCase();
        store.put({ word: upperWord });
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
        resolve(words);
      };
    });
  }

  async saveTrie(serializedTrie: ArrayBuffer): Promise<void> {
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

  async loadTrie(): Promise<ArrayBuffer | null> {
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
      transaction.oncomplete = () => resolve();
    });
  }
}

export const wordDB = new WordDatabase();
