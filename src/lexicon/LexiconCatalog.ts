import { processDigraphs } from '@/utils/digraphs';
import { classifyDeltaWord, classifyDemWord, sortNewWordsFirst } from './policy.mjs';
import type { LexiconMembership, LexiconMode } from './types';

interface WordSetPayload {
  version: number;
  releaseId: string;
  kind: string;
  count: number;
  words: string[];
}

const NEW_2027_WORDS_URL = '/lexicon/2027/new-words.json';
const LEGACY_WORDS_URL = '/lexicon/2027/legacy-words.json';
const NEW_DEM_WORDS_URL = '/lexicon/dem/rc4/new-words.json';
const EXPECTED_NEW_2027_WORDS = 10_975;
const EXPECTED_LEGACY_WORDS = 214;
const EXPECTED_NEW_DEM_WORDS = 20_590;

type CatalogKey = 'hybrid' | 'dem';

const normalizeWord = (word: string): string => processDigraphs(word.toUpperCase());

const assertPayload = (
  payload: WordSetPayload,
  expectedCount: number,
  label: string,
): void => {
  if (
    payload.count !== expectedCount ||
    payload.words.length !== expectedCount ||
    new Set(payload.words).size !== expectedCount
  ) {
    throw new Error(`El índice de ${label} está incompleto`);
  }
};

export class LexiconCatalog {
  private new2027Words = new Set<string>();
  private legacyWords = new Set<string>();
  private newDemWords = new Set<string>();
  private loadPromises = new Map<CatalogKey, Promise<void>>();

  async load(mode: LexiconMode): Promise<void> {
    if (mode !== 'hybrid' && mode !== 'dem') return;
    if (this.isLoaded(mode)) return;
    const pending = this.loadPromises.get(mode);
    if (pending) return pending;

    const promise = (mode === 'dem' ? this.loadDemIndex() : this.load2027Indexes())
      .catch((error) => {
        this.loadPromises.delete(mode);
        throw error;
      });
    this.loadPromises.set(mode, promise);
    return promise;
  }

  private isLoaded(mode: CatalogKey): boolean {
    if (mode === 'dem') return this.newDemWords.size === EXPECTED_NEW_DEM_WORDS;
    return (
      this.new2027Words.size === EXPECTED_NEW_2027_WORDS &&
      this.legacyWords.size === EXPECTED_LEGACY_WORDS
    );
  }

  private async loadDemIndex(): Promise<void> {
    const response = await fetch(NEW_DEM_WORDS_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error('No se pudo cargar el índice de aportaciones DEM');
    const payload = await response.json() as WordSetPayload;
    assertPayload(payload, EXPECTED_NEW_DEM_WORDS, 'aportaciones DEM');
    this.newDemWords = new Set(payload.words);
  }

  private async load2027Indexes(): Promise<void> {
    const [newResponse, legacyResponse] = await Promise.all([
      fetch(NEW_2027_WORDS_URL, { cache: 'force-cache' }),
      fetch(LEGACY_WORDS_URL, { cache: 'force-cache' }),
    ]);
    if (!newResponse.ok || !legacyResponse.ok) {
      throw new Error('No se pudieron cargar los índices de diferencias 2017/2027');
    }
    const [newPayload, legacyPayload] = await Promise.all([
      newResponse.json() as Promise<WordSetPayload>,
      legacyResponse.json() as Promise<WordSetPayload>,
    ]);
    assertPayload(newPayload, EXPECTED_NEW_2027_WORDS, 'novedades 2027');
    assertPayload(legacyPayload, EXPECTED_LEGACY_WORDS, 'formas exclusivas de 2017');
    this.new2027Words = new Set(newPayload.words);
    this.legacyWords = new Set(legacyPayload.words);
  }

  membership(word: string, mode: LexiconMode): LexiconMembership {
    const normalized = normalizeWord(word);
    if (mode === 'dem') return classifyDemWord(normalized, this.newDemWords);
    if (mode === 'hybrid') {
      return classifyDeltaWord(normalized, this.new2027Words, this.legacyWords);
    }
    return 'shared';
  }

  isValidForMode(word: string, mode: LexiconMode): boolean {
    const normalized = normalizeWord(word);
    if (mode === '2017') return !this.new2027Words.has(normalized);
    if (mode === '2027') return !this.legacyWords.has(normalized);
    return true;
  }

  sort(words: string[], mode: LexiconMode, newFirst: boolean): string[] {
    const newWords = mode === 'dem' ? this.newDemWords : this.new2027Words;
    return sortNewWordsFirst(
      words,
      newWords,
      (mode === 'dem' || mode === 'hybrid') && newFirst,
    );
  }

  getLegacyWords(): string[] {
    return [...this.legacyWords];
  }
}

export const lexiconCatalog = new LexiconCatalog();
