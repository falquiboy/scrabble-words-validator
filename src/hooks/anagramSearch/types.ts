export interface SearchResults {
  exactMatches: string[];
  wildcardMatches: string[];
  additionalWildcardMatches: string[];
  patternMatches: string[];
  shorterMatches: Map<number, Set<string>>;
}

export interface SearchState {
  data: SearchResults;
  isLoading: boolean;
  error: Error | null;
}