import { useQuery } from "@tanstack/react-query";
import { wordTrie } from "@/utils/trie";

export const useAnagramSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["words", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [] };
      
      const wildcardCount = (searchTerm.match(/\*/g) || []).length;
      console.log('Search term:', searchTerm, 'Wildcard count:', wildcardCount);

      if (wildcardCount === 0) {
        const exactMatches = wordTrie.search(searchTerm);
        return {
          exactMatches,
          wildcardMatches: [],
          additionalWildcardMatches: []
        };
      } else {
        const wildcardMatches = wordTrie.searchWithWildcards(searchTerm, wildcardCount);
        const additionalWildcardMatches = wordTrie.searchWithWildcards(searchTerm, wildcardCount + 1);
        
        return {
          exactMatches: [],
          wildcardMatches,
          additionalWildcardMatches
        };
      }
    },
    enabled: Boolean(searchTerm)
  });
};