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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Query for words using offline search hook
  const { data: results } = useOfflineAnagramSearch(searchTerm, showShorter, targetLength, trie);

  // Handle input changes
  const handleInputChange = (value: string) => {
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
      // Add to history only if it's a new search
      if (!searchHistory.includes(letters)) {
        const newHistory = [letters, ...searchHistory.slice(0, 9)];
        setSearchHistory(newHistory);
      }
      setHistoryIndex(-1);
    }
  };

  // Handle key press for search and history navigation
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < searchHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setLetters(searchHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setLetters(newIndex === -1 ? '' : searchHistory[newIndex]);
      }
    }
  };

  // Add ESC key listener
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (searchTerm && !results) {
          // If there's a search in progress (searchTerm exists but no results yet)
          setIsSearchAborted(true);
          setSearchTerm("");
          toast({
            title: "Búsqueda interrumpida",
            description: "La búsqueda ha sido cancelada.",
          });
        } else if (searchTerm && results) {
          // If results are already displayed
          setLetters("");
          setSearchTerm("");
          setTargetLength(null);
          setIsSearchAborted(false);
          setHistoryIndex(-1);
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [searchTerm, results, toast]);

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