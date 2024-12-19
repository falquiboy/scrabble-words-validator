import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useOfflineAnagramSearch(searchTerm, showShorter);

  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-ZÑñ*?/.]/g, '');
    setLetters(sanitizedValue.toUpperCase());
  };

  const handleSearch = () => {
    if (letters.trim()) {
      setSearchTerm(letters);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setLetters("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const renderHighlightedWord = (word: string, originalWord: string) => {
    const highlightedHtml = highlightWildcardLetter(word, originalWord);
    return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md flex flex-col h-screen px-4 pt-8">
      <div className="flex-none">
        <SearchInput
          letters={letters}
          showShorter={showShorter}
          onInputChange={handleInputChange}
          onSearch={handleSearch}
          onClear={handleClear}
          onKeyPress={handleKeyPress}
          onShowShorterChange={setShowShorter}
          inputRef={inputRef}
        />
      </div>
      <div className="flex-1 overflow-auto mt-4">
        <ResultsList
          isLoading={isLoading}
          searchTerm={searchTerm}
          results={{
            exactMatches: results?.exactMatches || [],
            wildcardMatches: results?.wildcardMatches || [],
            additionalWildcardMatches: results?.additionalWildcardMatches || [],
            patternMatches: results?.patternMatches || []
          }}
          highlightWildcardLetter={renderHighlightedWord}
        />
      </div>
    </div>
  );
};

export default Anagramador;