import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";

interface WordInputProps {
  word: string;
  isLoading: boolean;
  result: {
    isValid: boolean;
    checked: boolean;
    words: string[];
  };
  isEditing: boolean;
  onWordChange: (value: string) => void;
  onValidate: () => void;
  onClear: () => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}

const WordInput = ({
  word,
  isLoading,
  result,
  isEditing,
  onWordChange,
  onValidate,
  onClear,
  onEditStart,
  onEditEnd
}: WordInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (word) {
          onWordChange("");
        }
        onEditStart();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      } else if (e.key === "F2") {
        e.preventDefault();
        onEditStart();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [word, onWordChange, onEditStart]);

  const getInputBackground = () => {
    if (!result.checked) return "bg-white text-black";
    return result.isValid 
      ? "bg-scrabble-valid text-white" 
      : "bg-scrabble-invalid text-white";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    
    let value = input.value
      .split('')
      .map(char => {
        // Convert to uppercase first
        const upperChar = char.toUpperCase();
        
        // Allow direct digraph input (Ç, K, W) to pass through
        if (['Ç', 'K', 'W'].includes(upperChar)) return upperChar;
        
        // If it's Ñ/ñ, keep it as Ñ without any normalization
        if (upperChar === 'Ñ' || upperChar === 'ñ') {
          return 'Ñ';
        }
        
        // For all other characters, remove accents
        return upperChar
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .normalize('NFC');
      })
      .join('')
      .replace(/[^A-ZÑÇKWs\s]/g, '');  // Allow spaces by adding \s to the regex
    
    onWordChange(value);
    
    // Restore cursor position after the change
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onValidate();
    }
  };

  return (
    <div className="relative">
      <ScrollArea className={`h-40 rounded-md border border-gray-200 ${getInputBackground()}`}>
        <div className={`p-4 min-h-full flex items-center ${getInputBackground()}`}>
          {result.checked && !isEditing ? (
            <div 
              className="relative w-full" 
              onClick={onEditStart}
            >
              <div className="flex flex-wrap gap-3">
                {word.split(" ").map((w, i) => (
                  <span key={i} className="text-4xl font-bold">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              placeholder={!result.checked ? "Escribe una o más palabras..." : ""}
              value={word}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={`w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400`}
              onBlur={() => {
                if (!word.trim()) {
                  onEditEnd();
                }
              }}
              autoFocus
              spellCheck="false"
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              inputMode="text"
              enterKeyHint="done"
            />
          )}
        </div>
      </ScrollArea>
      {word && (
        <Button
          onClick={onClear}
          variant="ghost"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-transparent"
          type="button"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
          ) : result.checked ? (
            <X className="h-6 w-6 text-white hover:text-gray-200" />
          ) : (
            <Check className="h-6 w-6 text-scrabble-valid hover:text-scrabble-valid/80" />
          )}
        </Button>
      )}
    </div>
  );
};

export default WordInput;