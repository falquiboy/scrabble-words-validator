import { processDigraphs } from '@/utils/digraphs';
import { classifyDeltaWord, sortNewWordsFirst } from './policy.mjs';
import type { LexiconMembership, LexiconMode } from './types';

interface WordSetPayload {
  version: number;
  releaseId: string;
  kind: string;
  count: number;
  words: string[];
}

const NEW_WORDS_URL = '/lexicon/2027/new-words.json';
const LEGACY_WORDS_URL = '/lexicon/2027/legacy-words.json';
const EXPECTED_NEW_WORDS = 10_975;
const EXPECTED_LEGACY_WORDS = 214;

const normalizeWord = (word: string): string => processDigraphs(word.toUpperCase());

export class LexiconCatalog {
  private newWords = new Set<string>();
  private legacyWords = new Set<string>();
  private loadPromise: Promise<void> | null = null;

  async load(): Promise<void> {
    if (this.newWords.size === EXPECTED_NEW_WORDS && this.legacyWords.size === EXPECTED_LEGACY_WORDS) {
      return;
    }
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.loadIndexes().catch((error) => {
      this.loadPromise = null;
      throw error;
    });
    return this.loadPromise;
  }

  private async loadIndexes(): Promise<void> {
    const [newResponse, legacyResponse] = await Promise.all([
      fetch(NEW_WORDS_URL, { cache: 'force-cache' }),
      fetch(LEGACY_WORDS_URL, { cache: 'force-cache' }),
    ]);
    if (!newResponse.ok || !legacyResponse.ok) {
      throw new Error('No se pudieron cargar los índices de diferencias 2017/2027');
    }
    const [newPayload, legacyPayload] = await Promise.all([
      newResponse.json() as Promise<WordSetPayload>,
      legacyResponse.json() as Promise<WordSetPayload>,
    ]);
    if (
      newPayload.count !== EXPECTED_NEW_WORDS ||
      newPayload.words.length !== EXPECTED_NEW_WORDS ||
      legacyPayload.count !== EXPECTED_LEGACY_WORDS ||
      legacyPayload.words.length !== EXPECTED_LEGACY_WORDS
    ) {
      throw new Error('Los índices de diferencias 2017/2027 están incompletos');
    }
    this.newWords = new Set(newPayload.words);
    this.legacyWords = new Set(legacyPayload.words);
  }

  isNew2027(word: string): boolean {
    return this.newWords.has(normalizeWord(word));
  }

  isOnly2017(word: string): boolean {
    return this.legacyWords.has(normalizeWord(word));
  }

  membership(word: string): LexiconMembership {
    return classifyDeltaWord(normalizeWord(word), this.newWords, this.legacyWords);
  }

  isValidForMode(word: string, mode: LexiconMode): boolean {
    const normalized = normalizeWord(word);
    if (mode === '2017') return !this.newWords.has(normalized);
    if (mode === '2027') return !this.legacyWords.has(normalized);
    return true;
  }

  sort(words: string[], mode: LexiconMode, newFirst: boolean): string[] {
    if (mode !== 'hybrid' || !newFirst) return words;
    return sortNewWordsFirst(words, this.newWords, true);
  }

  getLegacyWords(): string[] {
    return [...this.legacyWords];
  }
}

export const lexiconCatalog = new LexiconCatalog();
