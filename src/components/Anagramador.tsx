import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useGlobalTrie } from "@/hooks/useGlobalTrie";
import { processDigraphs, toDisplayFormat, getInternalLength } from "@/utils/digraphs";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Use global Trie
  const { isLoading: isTrieLoading } = useGlobalTrie();

  // Query for words using offline search hook
  const { data: results, isLoading: isSearchLoading } = useOfflineAnagramSearch(searchTerm);

  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-ZÑñ*/.]/g, '');
    setLetters(sanitizedValue.toUpperCase());
  };

  // Handle search
  const handleSearch = () => {
    if (letters.trim()) {
      const processedLetters = processDigraphs(letters);
      console.log('Search term:', letters, 'Internal representation:', processedLetters, 'Internal length:', getInternalLength(letters));
      setSearchTerm(processedLetters);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clear
  const handleClear = () => {
    setLetters("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  // Create a wrapper function to handle the HTML dangerously
  const renderHighlightedWord = (word: string, originalWord: string) => {
    const displayWord = toDisplayFormat(word);
    const highlightedHtml = highlightWildcardLetter(displayWord, originalWord);
    return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (isTrieLoading) {
    return <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <SearchInput
        letters={letters}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        onClear={handleClear}
        onKeyPress={handleKeyPress}
        inputRef={inputRef}
      />
      <ResultsList
        isLoading={isSearchLoading}
        searchTerm={searchTerm}
        results={{
          exactMatches: results?.exactMatches.map(toDisplayFormat) || [],
          wildcardMatches: results?.wildcardMatches.map(toDisplayFormat) || [],
          additionalWildcardMatches: results?.additionalWildcardMatches.map(toDisplayFormat) || [],
          patternMatches: results?.patternMatches.map(toDisplayFormat) || [],
          shorterMatches: new Map(
            Array.from(results?.shorterMatches || new Map()).map(
              ([length, words]) => [length, new Set(Array.from(words).map(toDisplayFormat))]
            )
          )
        }}
        highlightWildcardLetter={renderHighlightedWord}
      />
    </div>
  );
};

export default Anagramador;