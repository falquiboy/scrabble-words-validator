import { useState } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { Trie } from "@/utils/trie/types";

interface AnagramadorProps {
  trie: Trie;
}

const Anagramador = ({ trie }: AnagramadorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const [targetLength, setTargetLength] = useState<number | null>(null);
  const [isSearchAborted, setIsSearchAborted] = useState(false);

  const { data: results } = useOfflineAnagramSearch(searchTerm, showShorter, targetLength, trie);

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
        isLoading={false}
        searchTerm={searchTerm}
        results={{
          exactMatches: results?.exactMatches || [],
          wildcardMatches: results?.wildcardMatches || [],
          additionalWildcardMatches: results?.additionalWildcardMatches || [],
          shorterMatches: showShorter ? (results?.shorterMatches || []) : [],
          patternMatches: results?.patternMatches || []
        }}
        highlightWildcardLetter={highlightWildcardLetter}
        isSearchAborted={isSearchAborted}
      />
    </div>
  );
};

export default Anagramador;