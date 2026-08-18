export type LexiconMode = '2017' | 'hybrid' | '2027';
export type LexiconReleaseKey = '2017' | '2027';
export type LexiconMembership = 'shared' | 'new-2027' | 'only-2017';

export interface WordSearchResultSet {
  exactMatches: string[];
  wildcardMatches: string[];
  additionalWildcardMatches: string[];
  shorterMatches: string[];
  patternMatches: string[];
}

export interface WordSearchService {
  search(word: string): boolean;
  searchAsync(word: string): Promise<boolean>;
  findAnagrams(letters: string): string[];
  findAnagramsAsync(letters: string): Promise<string[]>;
  findAnagramsWithOneAdditionalLetter(letters: string): Promise<string[]>;
  findAnagramsWithSubAnagrams(
    letters: string,
    includeSubanagrams?: boolean,
  ): Promise<{ exactMatches: string[]; shorterMatches: string[] }>;
  findPatternMatches(
    pattern: string,
    showLongerWords?: boolean,
    maxDefaultLength?: number,
    targetLength?: number | null,
  ): Promise<string[]>;
  findAnagramsWithWildcards(letters: string): Promise<{
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
  }>;
  getAllWords(): string[];
  getCurrentProvider(): 'trie' | 'sqlite' | 'supabase' | 'none';
  isTrieAvailable(): boolean;
}
