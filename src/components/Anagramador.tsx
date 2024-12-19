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
    <div className="flex flex-col h-screen">
      <div className="flex-none px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto w-full">
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
      </div>
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="h-full w-full md:max-w-6xl md:mx-auto">
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
    </div>
  );
};

export default Anagramador;