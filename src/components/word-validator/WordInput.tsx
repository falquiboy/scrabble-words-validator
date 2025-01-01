import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface WordInputProps {
  word: string;
  isLoading: boolean;
  isValidated: boolean;
  onWordChange: (value: string) => void;
  onValidate: () => void;
  onClear: () => void;
}

const WordInput = ({
  word,
  isLoading,
  isValidated,
  onWordChange,
  onValidate,
  onClear
}: WordInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isValidated) {
      inputRef.current?.focus();
    }
  }, [isValidated]);

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
    } else if (e.key === "Escape") {
      onClear();
    }
  };

  const handleButtonClick = () => {
    if (!word.trim()) return;
    if (isValidated) {
      onClear();
    } else {
      onValidate();
    }
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
        className={`w-full text-4xl font-bold bg-transparent outline-none placeholder:text-gray-400 p-4 transition-colors duration-300 ${
          isValidated ? 'text-white' : 'text-gray-900'
        }`}
        autoFocus
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        readOnly={isValidated}
      />
      {word && (
        <Button
          onClick={handleButtonClick}
          variant="ghost"
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-white/10 transition-colors rounded-full ${
            isValidated ? 'text-white' : ''
          }`}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
          ) : isValidated ? (
            <X className="h-6 w-6" />
          ) : (
            <Check className="h-6 w-6" />
          )}
        </Button>
      )}
    </div>
  );
};

export default WordInput;