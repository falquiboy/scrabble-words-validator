
import { useState, useEffect } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { Trie } from "@/utils/trie/types";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface AnagramadorProps {
  trie: Trie;
}

const Anagramador = ({ trie }: AnagramadorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const [targetLength, setTargetLength] = useState<number | null>(null);
  const [isSearchAborted, setIsSearchAborted] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    exactMatches: [],
    wildcardMatches: [],
    additionalWildcardMatches: [],
    shorterMatches: [],
    patternMatches: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Perform search when component mounts or when search parameters change
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || !trie) return;
      
      setIsLoading(true);
      console.log('Starting search for:', searchTerm);
      
      try {
        const { data } = await useOfflineAnagramSearch(searchTerm, showShorter, targetLength, trie);
        console.log('Search results:', data);
        setSearchResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchTerm, showShorter, targetLength, trie]);

  const handleSearch = (letters: string, newTargetLength: number | null) => {
    setIsSearchAborted(false);
    setSearchTerm(letters);
    setTargetLength(newTargetLength);
    setShowShorter(false); // Reset showShorter on new search
  };

  const handleClear = () => {
    setSearchTerm("");
    setTargetLength(null);
    setIsSearchAborted(false);
    setShowShorter(false);
  };

  const handleShowShorterChange = (show: boolean) => {
    setShowShorter(show);
    setTargetLength(null); // Clear target length when showing shorter words
  };

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <SearchContainer
        onSearch={handleSearch}
        onClear={handleClear}
        onShowShorterChange={handleShowShorterChange}
        showShorter={showShorter}
        hasActiveSearch={!!searchTerm}
      />
      <ResultsList
        isLoading={isLoading}
        searchTerm={searchTerm}
        results={searchResults}
        highlightWildcardLetter={highlightWildcardLetter}
        isSearchAborted={isSearchAborted}
      />
    </div>
  );
};

export default Anagramador;
