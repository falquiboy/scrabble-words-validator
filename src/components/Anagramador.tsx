import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { Trie } from "@/utils/trie/types";
import { useToast } from "@/hooks/use-toast";

interface AnagramadorProps {
  trie: Trie;
}

const Anagramador = ({ trie }: AnagramadorProps) => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const [targetLength, setTargetLength] = useState<number | null>(null);
  const [isSearchAborted, setIsSearchAborted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      setIsSearchAborted(false);
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
    setIsSearchAborted(false);
    inputRef.current?.focus();
  };

  // Create a wrapper function to handle the HTML dangerously
  const renderHighlightedWord = (word: string, originalWord: string) => {
    const highlightedHtml = highlightWildcardLetter(word, originalWord);
    return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
  };

  // Add ESC key listener
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchTerm) {
        setIsSearchAborted(true);
        setSearchTerm("");
        toast({
          title: "Búsqueda interrumpida",
          description: "La búsqueda ha sido cancelada.",
        });
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [searchTerm, toast]);

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
          additionalWildcardMatches: results?.additionalWildcardMatches || [],
          shorterMatches: results?.shorterMatches || [],
          patternMatches: results?.patternMatches || []
        }}
        highlightWildcardLetter={renderHighlightedWord}
        isSearchAborted={isSearchAborted}
      />
    </div>
  );
};

export default Anagramador;