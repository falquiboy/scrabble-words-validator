export interface SearchResults {
  exactMatches: string[];
  wildcardMatches: string[];
  additionalWildcardMatches: string[];
  patternMatches: string[];
}

export interface SearchState {
  data: SearchResults;
  isLoading: boolean;
  error: string | null;
}