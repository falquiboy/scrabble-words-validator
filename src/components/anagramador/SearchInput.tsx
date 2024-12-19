import { useState, useRef } from "react";
import SearchField from "./search/SearchField";
import ShorterWordsToggle from "./search/ShorterWordsToggle";

interface SearchInputProps {
  letters: string;
  showShorter: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowShorterChange: (checked: boolean) => void;
  isLoading: boolean;
}

export const SearchInput = ({ 
  letters, 
  showShorter,
  onInputChange, 
  onSearch, 
  onClear, 
  onKeyPress, 
  onShowShorterChange,
  isLoading
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValidate = () => {
    onSearch();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidate();
    } else {
      onKeyPress(e);
    }
  };

  return (
    <div className="space-y-2">
      <SearchField
        letters={letters}
        onInputChange={onInputChange}
        onValidate={handleValidate}
        onClear={onClear}
        onKeyPress={handleKeyPress}
        isLoading={isLoading}
      />
      <ShorterWordsToggle
        showShorter={showShorter}
        onShowShorterChange={onShowShorterChange}
      />
    </div>
  );
};