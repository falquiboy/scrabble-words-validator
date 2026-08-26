import { findAnagrams } from '@/hooks/anagramSearch/utils';
import { mergeUniqueWords } from '@/lexicon/policy.mjs';
import type { WordSearchService } from '@/lexicon/types';
import { findPatternMatches as findPatternMatchesInTrie } from '@/utils/pattern';
import { processDigraphs } from '@/utils/digraphs';
import { Trie } from '@/utils/trie';

export class HybridLexiconSearchService implements WordSearchService {
  private readonly legacyTrie = new Trie();
  private readonly legacyWords: string[];

  constructor(
    private readonly primary: WordSearchService,
    legacyWords: readonly string[],
  ) {
    this.legacyWords = [...legacyWords];
    for (const word of this.legacyWords) this.legacyTrie.insert(word, word);
  }

  private merge(primary: string[], legacy: string[]): string[] {
    return mergeUniqueWords(primary, legacy);
  }

  search(word: string): boolean {
    const normalized = processDigraphs(word.toUpperCase());
    return this.primary.search(normalized) || this.legacyTrie.search(normalized);
  }

  async searchAsync(word: string): Promise<boolean> {
    const normalized = processDigraphs(word.toUpperCase());
    return this.legacyTrie.search(normalized) || this.primary.searchAsync(normalized);
  }

  findAnagrams(letters: string): string[] {
    const normalized = processDigraphs(letters.toUpperCase());
    return this.merge(this.primary.findAnagrams(normalized), this.legacyTrie.findAnagrams(normalized));
  }

  async findAnagramsAsync(letters: string): Promise<string[]> {
    const normalized = processDigraphs(letters.toUpperCase());
    return this.merge(
      await this.primary.findAnagramsAsync(normalized),
      this.legacyTrie.findAnagrams(normalized),
    );
  }

  async findAnagramsWithOneAdditionalLetter(letters: string): Promise<string[]> {
    const primary = await this.primary.findAnagramsWithOneAdditionalLetter(letters);
    const legacy = findAnagrams(`${letters}?`, this.legacyTrie, false).wildcardMatches;
    return this.merge(primary, legacy);
  }

  async findAnagramsWithSubAnagrams(
    letters: string,
    includeSubanagrams = false,
  ): Promise<{ exactMatches: string[]; shorterMatches: string[] }> {
    const primary = await this.primary.findAnagramsWithSubAnagrams(letters, includeSubanagrams);
    const legacy = findAnagrams(letters, this.legacyTrie, includeSubanagrams);
    return {
      exactMatches: this.merge(primary.exactMatches, legacy.exactMatches),
      shorterMatches: this.merge(primary.shorterMatches, legacy.shorterMatches),
    };
  }

  async findPatternMatches(
    pattern: string,
    showLongerWords = false,
    maxDefaultLength = 8,
    targetLength: number | null = null,
  ): Promise<string[]> {
    const [primary, legacy] = await Promise.all([
      this.primary.findPatternMatches(pattern, showLongerWords, maxDefaultLength, targetLength),
      findPatternMatchesInTrie(
        pattern,
        this.legacyTrie,
        showLongerWords,
        maxDefaultLength,
        targetLength,
      ),
    ]);
    return this.merge(primary, legacy);
  }

  async findAnagramsWithWildcards(letters: string, includeSubanagrams = false): Promise<{
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    shorterMatches: string[];
  }> {
    const primary = await this.primary.findAnagramsWithWildcards(letters, includeSubanagrams);
    const legacy = findAnagrams(letters, this.legacyTrie, includeSubanagrams);
    return {
      exactMatches: this.merge(primary.exactMatches, legacy.exactMatches),
      wildcardMatches: this.merge(primary.wildcardMatches, legacy.wildcardMatches),
      additionalWildcardMatches: this.merge(
        primary.additionalWildcardMatches,
        legacy.additionalWildcardMatches,
      ),
      shorterMatches: this.merge(primary.shorterMatches, legacy.shorterMatches),
    };
  }

  getAllWords(): string[] {
    return this.merge(this.primary.getAllWords(), this.legacyWords);
  }

  getCurrentProvider(): 'trie' | 'sqlite' | 'supabase' | 'none' {
    return this.primary.getCurrentProvider();
  }

  isTrieAvailable(): boolean {
    return this.primary.isTrieAvailable();
  }
}
