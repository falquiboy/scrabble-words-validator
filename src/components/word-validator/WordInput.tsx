import React, { useRef, useEffect, useState } from 'react';
import { Search, X } from "lucide-react";

interface WordInputProps {
  word: string;
  isLoading: boolean;
  onWordChange: (value: string) => void;
  onValidate: () => void;
  onClear: () => void;
}

const WordInput = ({
  word,
  isLoading,
  onWordChange,
  onValidate,
  onClear
}: WordInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    let value = input.value.toUpperCase()
      .split('')
      .map(char => {
        if (['Ç', 'K', 'W'].includes(char)) return char;
        if (char === 'Ñ' || char === 'ñ') return 'Ñ';
        return char
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .normalize('NFC');
      })
      .join('')
      .replace(/[^A-ZÑÇKWs\s]/g, '');
    
    onWordChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onValidate();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Escribe una o más palabras..."
        value={word}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400 p-4 min-h-40 border border-gray-200 rounded-md transition-all duration-200"
        autoFocus
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {word ? (
          <button
            onClick={onClear}
            className="h-12 w-12 p-0 hover:text-gray-600 transition-colors duration-200 rounded-full flex items-center justify-center touch-manipulation"
            type="button"
            disabled={isLoading}
            aria-label="Clear input"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
            ) : (
              <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
            )}
          </button>
        ) : !isFocused && (
          <Search className="h-6 w-6 text-gray-400" />
        )}
      </div>
    </div>
  );
};

export default WordInput;