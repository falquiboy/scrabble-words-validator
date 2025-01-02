import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { processDigraphs } from '@/utils/digraphs';

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    let value = input.value.toUpperCase();

    // First normalize accents and special characters, preserving Ñ
    value = value.split('')
      .map(char => {
        if (char === 'Ñ' || char === 'ñ') return 'Ñ';
        return char
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .normalize('NFC');
      })
      .join('');

    // Allow only valid Spanish characters and spaces
    value = value.replace(/[^A-ZÑÇKW\s]/g, '');
    
    // If the input contains internal representations (Ç, K, W), keep them as is
    if (value.match(/[ÇKW]/)) {
      onWordChange(value);
      return;
    }

    // Otherwise, process natural digraphs
    const processedValue = processDigraphs(value);
    onWordChange(processedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onValidate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClear();
      // Ensure input is focused after clearing
      inputRef.current?.focus();
    }
  };

  const handleClearClick = () => {
    onClear();
    // Ensure input is focused after clearing via button
    inputRef.current?.focus();
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
        className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400 p-4 min-h-40 border border-gray-200 rounded-md"
        autoFocus
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
      />
      {word && (
        <Button
          onClick={handleClearClick}
          variant="ghost"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-transparent"
          type="button"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
          ) : (
            <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
          )}
        </Button>
      )}
    </div>
  );
};

export default WordInput;
