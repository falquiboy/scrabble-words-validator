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

  const bgColor = 'bg-white';
  const textColor = 'text-gray-900';
  const placeholderColor = 'placeholder:text-gray-400';

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Escribe una o más palabras..."
        value={word}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={`w-full text-2xl font-bold ${bgColor} ${textColor} outline-none ${placeholderColor} p-4 min-h-40 border border-gray-200 rounded-md`}
        autoFocus
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        readOnly={isValidated}
      />
      {word && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button
            onClick={handleButtonClick}
            variant="ghost"
            className="h-12 w-12 p-0 hover:bg-gray-100 transition-colors rounded-full"
            type="button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
            ) : isValidated ? (
              <X className="h-6 w-6 text-scrabble-invalid" />
            ) : (
              <Check className="h-6 w-6 text-scrabble-valid" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WordInput;