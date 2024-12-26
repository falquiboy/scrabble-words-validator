import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { Trie } from "@/utils/trie/types";

interface AnagramadorProps {
  trie: Trie;
}

const Anagramador = ({ trie }: AnagramadorProps) => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const [targetLength, setTargetLength] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Query for words using offline search hook
  const { data: results } = useOfflineAnagramSearch(searchTerm, showShorter, targetLength, trie);

  // Handle input changes
  const handleInputChange = (value: string) => {
    // Allow all characters initially, validation will happen in inputValidation.ts
    setLetters(value);

    // Check for length filter
    const lengthMatch = value.match(/\/(\d+)$/);
    if (lengthMatch) {
      const length = parseInt(lengthMatch[1], 10);
      setTargetLength(length);
      // Remove the length filter from the letters
      value = value.replace(/\/\d+$/, '');
    } else {
      setTargetLength(null);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (letters.trim()) {
      setSearchTerm(letters);
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
    setTargetLength(null);
    inputRef.current?.focus();
  };

  // Create a wrapper function to handle the HTML dangerously
  const renderHighlightedWord = (word: string, originalWord: string) => {
    const highlightedHtml = highlightWildcardLetter(word, originalWord);
    return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <SearchInput
        letters={letters}
        showShorter={showShorter}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        onClear={handleClear}
        onKeyPress={handleKeyPress}
        onShowShorterChange={(checked) => {
          setShowShorter(checked);
          // Trigger a new search immediately when toggling showShorter
          if (searchTerm) {
            setSearchTerm(searchTerm);
          }
        }}
        inputRef={inputRef}
      />
      <ResultsList
        isLoading={false}
        searchTerm={searchTerm}
        results={{
          exactMatches: results?.exactMatches || [],
          wildcardMatches: results?.wildcardMatches || [],
          additionalWildcardMatches: showShorter ? (results?.additionalWildcardMatches || []) : [],
          patternMatches: results?.patternMatches || []
        }}
        highlightWildcardLetter={renderHighlightedWord}
      />
    </div>
  );
};

export default Anagramador;