/**
 * Diccionario SQLite offline-first.
 *
 * La base completa se genera antes del deploy. El navegador sólo descarga,
 * descomprime y abre una SQLite ya indexada; nunca construye 639 mil filas.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { gunzipSync } from 'fflate';

export interface WordEntry {
  word: string;
  alphagram: string;
  length: number;
  points?: number;
}

const OFFLINE_DATABASE_URL = '/lexicon.dbpack';
const MINIMUM_WORD_COUNT = 600_000;

export class SQLiteWordDatabase {
  private static instance: SQLiteWordDatabase;
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (SQLiteWordDatabase.instance) return SQLiteWordDatabase.instance;
    SQLiteWordDatabase.instance = this;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initializeDatabase().catch((error) => {
      this.initPromise = null;
      throw error;
    });
    return this.initPromise;
  }

  private async initializeDatabase(): Promise<void> {
    console.log('📚 Iniciando diccionario SQLite offline…');
    this.SQL = await initSqlJs({ locateFile: (file) => `/${file}` });

    const databaseBytes = await this.downloadPackagedDatabase();
    this.db = new this.SQL.Database(databaseBytes);
    const wordCount = await this.getWordCount();
    if (wordCount < MINIMUM_WORD_COUNT) {
      this.db.close();
      this.db = null;
      throw new Error(`Diccionario offline incompleto (${wordCount} palabras)`);
    }

    this.isInitialized = true;
    await this.notifyHybridService();
    console.log(`✅ SQLite offline lista (${wordCount} palabras)`);

  }

  private async downloadPackagedDatabase(): Promise<Uint8Array> {
    const response = await fetch(OFFLINE_DATABASE_URL, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`No se pudo descargar el diccionario offline (${response.status})`);
    }

    if ('DecompressionStream' in globalThis && response.body) {
      const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    // Compatibilidad con iOS/Safari anteriores a DecompressionStream.
    return gunzipSync(new Uint8Array(await response.arrayBuffer()));
  }

  async addWords(words: WordEntry[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const statement = this.db.prepare(
      'INSERT INTO words (word, alphagram, length) VALUES (?, ?, ?)'
    );
    this.db.exec('BEGIN');
    try {
      for (const entry of words) statement.run([entry.word, entry.alphagram, entry.length]);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    } finally {
      statement.free();
    }
  }

  async findAnagramsByAlphagram(alphagram: string): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');
    const statement = this.db.prepare(
      'SELECT word FROM words WHERE alphagram = ? ORDER BY word'
    );
    statement.bind([alphagram]);
    const words: string[] = [];
    while (statement.step()) words.push(statement.getAsObject().word as string);
    statement.free();
    return words;
  }

  async findWordsByLength(length: number): Promise<WordEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    const statement = this.db.prepare(
      'SELECT word, alphagram, length FROM words WHERE length = ? ORDER BY word'
    );
    statement.bind([length]);
    const words: WordEntry[] = [];
    while (statement.step()) {
      const row = statement.getAsObject();
      words.push({
        word: row.word as string,
        alphagram: row.alphagram as string,
        length: row.length as number,
      });
    }
    statement.free();
    return words;
  }

  async getAllWords(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');
    const statement = this.db.prepare('SELECT word FROM words ORDER BY word');
    const words: string[] = [];
    while (statement.step()) words.push(statement.getAsObject().word as string);
    statement.free();
    return words;
  }

  async getWordCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.exec('SELECT COUNT(*) AS count FROM words')[0];
    return (result?.values[0][0] as number) || 0;
  }

  // No se vuelve a serializar el trie dentro de SQLite: esa segunda copia
  // gigante era la causa del cierre de Safari.
  async saveTrie(): Promise<void> {}
  async loadTrie(): Promise<null> { return null; }
  async clearTrie(): Promise<void> {}

  async saveToCache(): Promise<void> {
    // El service worker conserva el paquete comprimido (15 MB). Guardar además
    // la SQLite expandida (39 MB) en IndexedDB duplicaba memoria y almacenamiento.
  }

  private async notifyHybridService(): Promise<void> {
    try {
      const { hybridTrieService } = await import('./HybridTrieService');
      hybridTrieService.notifySqliteReady();
    } catch {
      // React puede estar usando otra instancia híbrida; esa instancia también
      // espera directamente a sqliteDB.init().
    }
  }

  close(): void {
    this.db?.close();
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const sqliteDB = new SQLiteWordDatabase();
