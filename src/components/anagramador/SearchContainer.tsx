
import { useState, useRef } from "react";
import SearchInput from "./SearchInput";
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
    let targetLength = null;
    let cleanedValue = value;
    
    // Extract target length if present using colon format
    const lengthMatch = value.match(/\:(\d+)$/);
    if (lengthMatch) {
      targetLength = parseInt(lengthMatch[1], 10);
      console.log('Target length extracted from colon format:', targetLength);
    }

    // Reset showShorter to false when input changes
    if (value !== letters) {
      onShowShorterChange(false);
    }

    // Set the cleaned value in state
    setLetters(cleanedValue);
    return targetLength;
  };

  const handleSearch = () => {
    if (letters.trim()) {
      const targetLength = handleInputChange(letters);
      
      // Ensure we reset showShorter before starting a new search
      onShowShorterChange(false);
      
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
    
    // Reset showShorter to false when clearing
    onShowShorterChange(false);
    
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
