import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface WordInputProps {
  word: string;
  isLoading: boolean;
  onWordChange: (word: string) => void;
  onValidate: () => void;
  onClear: () => void;
}

const WordInput = ({ word, isLoading, onWordChange, onValidate, onClear }: WordInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    let value = input.value.toUpperCase();

    // Only normalize Ñ and remove accents, keeping all valid Spanish characters
    value = value.split('')
      .map(char => {
        if (char === 'Ñ' || char === 'ñ') return 'Ñ';
        return char
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .normalize('NFC');
      })
      .join('');
    
    // Allow Spanish characters and spaces
    value = value.replace(/[^A-ZÑ\s]/g, '');
    onWordChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onValidate();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 text-lg border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe una palabra..."
            disabled={isLoading}
          />
          {word && (
            <button
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button
          onClick={onValidate}
          disabled={!word.trim() || isLoading}
          className="px-6"
        >
          Validar
        </Button>
      </div>
    </div>
  );
};

export default WordInput;
