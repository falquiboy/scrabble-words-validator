import { useState, useRef } from "react";
import SearchInput from "../SearchInput";
import { useToast } from "@/hooks/use-toast";

interface SearchContainerProps {
  onSearch: (letters: string, targetLength: number | null) => void;
  onClear: () => void;
  onShowShorterChange: (show: boolean) => void;
  showShorter: boolean;
  hasActiveSearch: boolean;
}

const SearchContainer = ({ 
  onSearch, 
  onClear, 
  onShowShorterChange,
  showShorter,
  hasActiveSearch 
}: SearchContainerProps) => {
  const [letters, setLetters] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (value: string) => {
    setLetters(value);
    let targetLength = null;
    
    const lengthMatch = value.match(/\/(\d+)$/);
    if (lengthMatch) {
      targetLength = parseInt(lengthMatch[1], 10);
      value = value.replace(/\/\d+$/, '');
    }

    return targetLength;
  };

  const handleSearch = () => {
    if (letters.trim()) {
      const targetLength = handleInputChange(letters);
      onSearch(letters, targetLength);
      
      if (!searchHistory.includes(letters)) {
        setSearchHistory([letters, ...searchHistory.slice(0, 9)]);
      }
      setHistoryIndex(-1);
    }
  };

  const handleClear = () => {
    setLetters("");
    setHistoryIndex(-1);
    onClear();
    inputRef.current?.focus();
  };

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

  return (
    <SearchInput
      letters={letters}
      showShorter={showShorter}
      onInputChange={handleInputChange}
      onSearch={handleSearch}
      onClear={handleClear}
      onKeyPress={handleKeyPress}
      onShowShorterChange={onShowShorterChange}
      inputRef={inputRef}
      hasActiveSearch={hasActiveSearch}
    />
  );
};

export default SearchContainer;