
import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { processDigraphs } from '@/utils/digraphs';

interface WordInputProps {
  word: string;
  isLoading: boolean;
  onWordChange: (word: string) => void;
  onValidate: () => void;
  buttonText: string;
  isChecked: boolean;
}

const WordInput = ({ 
  word, 
  isLoading, 
  onWordChange, 
  onValidate, 
  buttonText,
  isChecked 
}: WordInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Add effect to focus input when word is cleared
  useEffect(() => {
    if (!word && inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [word, isLoading]);

  // Effect to restore cursor position after state update
  useEffect(() => {
    if (cursorPositionRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current
      );
      cursorPositionRef.current = null;
    }
  }, [word]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    // Save cursor position before state update
    cursorPositionRef.current = input.selectionStart;
    
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
    
    // Calculate cursor position adjustment based on length difference
    if (value.length !== input.value.length && cursorPositionRef.current !== null) {
      const lengthDiff = value.length - input.value.length;
      cursorPositionRef.current = Math.max(0, cursorPositionRef.current + lengthDiff);
    }
    
    onWordChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onValidate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isChecked && !isLoading) {
        onValidate(); // This will clear in checked state
      } else if (word) {
        onWordChange(''); // Just clear the input if we're not in checked state
      }
      // Ensure input gets focused after clearing
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
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
            placeholder={isLoading ? "Cargando diccionario..." : "Escribe una palabra..."}
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={onValidate}
          disabled={(!word.trim() && !isChecked) || isLoading}
          className="px-6"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default WordInput;
