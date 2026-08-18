/**
 * Diccionario SQLite offline-first fragmentado por longitud.
 *
 * Safari nunca abre la base completa: conserva como máximo cuatro fragmentos
 * pequeños y expulsa los menos recientes. Así mantenemos índices SQL sin el
 * pico de memoria de una SQLite monolítica.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { gunzipSync } from 'fflate';

export interface WordEntry {
  word: string;
  alphagram: string;
  length: number;
  points?: number;
}

interface DictionaryShard {
  url: string;
  wordCount: number;
  compressedBytes: number;
  sqliteBytes: number;
}

export interface DictionaryManifest {
  version: number;
  format: string;
  wordCount: number;
  totalCompressedBytes: number;
  totalSqliteBytes: number;
  lengths: Record<string, DictionaryShard>;
}

interface OpenShard {
  db: Database;
  activeQueries: number;
  lastUsed: number;
}

const MAX_OPEN_SHARDS = 4;

export interface SQLiteWordDatabaseOptions {
  manifestUrl?: string;
  minimumWordCount?: number;
  label?: string;
}

export class SQLiteWordDatabase {
  private SQL: SqlJsStatic | null = null;
  private manifest: DictionaryManifest | null = null;
  private shards = new Map<number, OpenShard>();
  private shardPromises = new Map<number, Promise<OpenShard>>();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly manifestUrl: string;
  private readonly minimumWordCount: number;
  private readonly label: string;

  constructor({
    manifestUrl = '/lexicon/manifest.json',
    minimumWordCount = 600_000,
    label = '2017',
  }: SQLiteWordDatabaseOptions = {}) {
    this.manifestUrl = manifestUrl;
    this.minimumWordCount = minimumWordCount;
    this.label = label;
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
    console.log(`📚 Iniciando índice SQLite ${this.label}…`);
    const [SQL, manifestResponse] = await Promise.all([
      initSqlJs({ locateFile: (file) => `/${file}` }),
      fetch(this.manifestUrl, { cache: 'force-cache' }),
    ]);

    if (!manifestResponse.ok) {
      throw new Error(`No se pudo cargar el manifiesto offline (${manifestResponse.status})`);
    }

    const manifest = (await manifestResponse.json()) as DictionaryManifest;
    if (
      manifest.format !== 'sqlite-length-shards' ||
      manifest.wordCount < this.minimumWordCount
    ) {
      throw new Error(`Diccionario offline incompleto (${manifest.wordCount ?? 0})`);
    }

    this.SQL = SQL;
    this.manifest = manifest;
    this.isInitialized = true;
    console.log(`✅ Índice SQLite ${this.label} listo (${manifest.wordCount} palabras)`);
  }

  private async withShard<T>(
    length: number,
    operation: (db: Database) => T | Promise<T>
  ): Promise<T> {
    await this.init();
    const shard = await this.getShard(length);
    shard.activeQueries += 1;
    shard.lastUsed = Date.now();
    try {
      return await operation(shard.db);
    } finally {
      shard.activeQueries -= 1;
      shard.lastUsed = Date.now();
      this.evictUnusedShards();
    }
  }

  private async getShard(length: number): Promise<OpenShard> {
    const existing = this.shards.get(length);
    if (existing) return existing;

    const inFlight = this.shardPromises.get(length);
    if (inFlight) return inFlight;

    const promise = this.loadShard(length).finally(() => {
      this.shardPromises.delete(length);
    });
    this.shardPromises.set(length, promise);
    return promise;
  }

  private async loadShard(length: number): Promise<OpenShard> {
    if (!this.SQL || !this.manifest) throw new Error('Database not initialized');
    const descriptor = this.manifest.lengths[String(length)];
    if (!descriptor) throw new Error(`No dictionary shard for length ${length}`);

    const response = await fetch(descriptor.url, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`No se pudo cargar el índice de ${length} letras (${response.status})`);
    }

    const databaseBytes = await this.decompressResponse(response);
    const shard: OpenShard = {
      db: new this.SQL.Database(databaseBytes),
      activeQueries: 0,
      lastUsed: Date.now(),
    };
    this.shards.set(length, shard);
    console.log(`⚡ SQLite ${length} letras lista (${descriptor.wordCount} palabras)`);
    return shard;
  }

  private async decompressResponse(response: Response): Promise<Uint8Array> {
    if ('DecompressionStream' in globalThis && response.body) {
      const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return gunzipSync(new Uint8Array(await response.arrayBuffer()));
  }

  private evictUnusedShards(): void {
    if (this.shards.size <= MAX_OPEN_SHARDS) return;
    const candidates = [...this.shards.entries()]
      .filter(([, shard]) => shard.activeQueries === 0)
      .sort((left, right) => left[1].lastUsed - right[1].lastUsed);

    while (this.shards.size > MAX_OPEN_SHARDS && candidates.length) {
      const [length, shard] = candidates.shift()!;
      shard.db.close();
      this.shards.delete(length);
    }
  }

  async addWords(_words: WordEntry[]): Promise<void> {
    throw new Error('El diccionario offline empaquetado es de sólo lectura');
  }

  async findAnagramsByAlphagram(alphagram: string): Promise<string[]> {
    const length = [...alphagram].length;
    return this.withShard(length, (db) => {
      const statement = db.prepare(
        'SELECT word FROM words WHERE alphagram = ? ORDER BY word'
      );
      statement.bind([alphagram]);
      const words: string[] = [];
      while (statement.step()) words.push(statement.getAsObject().word as string);
      statement.free();
      return words;
    });
  }

  async findAnagramsByAlphagrams(alphagrams: string[]): Promise<string[]> {
    const uniqueAlphagrams = Array.from(new Set(alphagrams));
    if (uniqueAlphagrams.length === 0) return [];

    const alphagramsByLength = new Map<number, string[]>();
    for (const alphagram of uniqueAlphagrams) {
      const length = [...alphagram].length;
      const group = alphagramsByLength.get(length) || [];
      group.push(alphagram);
      alphagramsByLength.set(length, group);
    }

    const resultGroups = await Promise.all(
      [...alphagramsByLength.entries()].map(async ([length, group]) => {
        const chunks: string[][] = [];
        for (let index = 0; index < group.length; index += 900) {
          chunks.push(group.slice(index, index + 900));
        }

        const chunkResults = await Promise.all(
          chunks.map((chunk) => this.withShard(length, (db) => {
            const placeholders = chunk.map(() => '?').join(', ');
            const statement = db.prepare(
              `SELECT word FROM words WHERE alphagram IN (${placeholders}) ORDER BY word`
            );
            statement.bind(chunk);
            const words: string[] = [];
            while (statement.step()) words.push(statement.getAsObject().word as string);
            statement.free();
            return words;
          }))
        );

        return chunkResults.flat();
      })
    );

    return Array.from(new Set(resultGroups.flat())).sort();
  }

  async findWordsByLength(length: number): Promise<WordEntry[]> {
    await this.init();
    if (!this.manifest?.lengths[String(length)]) return [];
    return this.withShard(length, (db) => {
      const statement = db.prepare(
        'SELECT word, alphagram, length FROM words ORDER BY word'
      );
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
    });
  }

  async getAllWords(): Promise<string[]> {
    await this.init();
    if (!this.manifest) return [];
    const words: string[] = [];
    const lengths = Object.keys(this.manifest.lengths)
      .map(Number)
      .sort((left, right) => left - right);
    for (const length of lengths) {
      const shardWords = await this.withShard(length, (db) => {
        const statement = db.prepare('SELECT word FROM words ORDER BY word');
        const result: string[] = [];
        while (statement.step()) result.push(statement.getAsObject().word as string);
        statement.free();
        return result;
      });
      words.push(...shardWords);
    }
    return words;
  }

  async getWordCount(): Promise<number> {
    await this.init();
    return this.manifest?.wordCount ?? 0;
  }

  async saveTrie(): Promise<void> {}
  async loadTrie(): Promise<null> { return null; }
  async clearTrie(): Promise<void> {}
  async saveToCache(): Promise<void> {}

  close(): void {
    for (const shard of this.shards.values()) shard.db.close();
    this.shards.clear();
    this.shardPromises.clear();
    this.SQL = null;
    this.manifest = null;
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const sqliteDB = new SQLiteWordDatabase();
