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

  useEffect(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      setSearchResults({ exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], shorterMatches: [], patternMatches: [] });
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const search = async () => {
      setIsLoading(true);
      setIsSearchAborted(false);
      try {
        const results = await useOfflineAnagramSearch(
          trimmedSearchTerm,
          trie,
          showShorter,
          targetLength,
          abortController.signal
        );
        setSearchResults(results);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setIsSearchAborted(true);
          console.log("Search aborted:", error);
        } else {
          console.error("Error during anagram search:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    search();

    return () => {
      abortController.abort();
    };
  }, [searchTerm, showShorter, targetLength, trie]);

  const handleSearch = (letters: string, newTargetLength: number | null) => {
    setSearchTerm(letters);
    setTargetLength(newTargetLength);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchResults({ exactMatches: [], wildcardMatches: [], additionalWildcardMatches: [], shorterMatches: [], patternMatches: [] });
    setIsSearchAborted(false);
  };

  const handleShowShorterChange = (show: boolean) => {
    setShowShorter(show);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-4">
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
    </div>
  );
};

export default Anagramador;
