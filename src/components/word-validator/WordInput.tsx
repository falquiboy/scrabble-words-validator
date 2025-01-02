import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { processDigraphs } from '@/utils/digraphs';

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
        if (char === 'Ç' || char === 'ç') return 'Ç';
        return char
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .normalize('NFC');
      })
      .join('');
    
    // Allow Spanish characters (including Ç) and spaces
    value = value.replace(/[^A-ZÑÇKW\s]/g, '');
    onWordChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onValidate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClear();
      // Ensure input gets focused after clearing
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    onClear();
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
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
              onClick={handleClear}
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
