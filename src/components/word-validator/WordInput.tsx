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

  const getInputBackground = () => {
    if (!result.checked) return "bg-white text-black";
    return result.isValid 
      ? "bg-scrabble-valid text-white" 
      : "bg-scrabble-invalid text-white";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    
    // First, convert to uppercase and preserve Ñ
    const upperValue = input.value.toUpperCase();
    
    // Replace Ñ with a temporary token
    const withToken = upperValue.replace(/Ñ/g, '__NTILDE__');
    
    // Remove accents while preserving base characters
    const normalized = withToken
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    // Clean up and restore Ñ
    const value = normalized
      .replace(/[^A-Z\s__NTILDE__]/g, '')  // Only allow uppercase letters, spaces, and our token
      .replace(/[KW]/g, '')                 // Remove K and W
      .replace(/__NTILDE__/g, 'Ñ');        // Restore Ñ
    
    onWordChange(value);
    
    // Restore cursor position after the change
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onValidate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (word) {
        onWordChange("");
      }
      onEditEnd();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <ScrollArea className={`h-32 rounded-md ${getInputBackground()}`}>
        <div className={`p-3 min-h-full ${getInputBackground()}`}>
          {result.checked && !isEditing ? (
            <div 
              className="relative" 
              onClick={onEditStart}
            >
              <div className="flex flex-wrap gap-2">
                {word.split(" ").map((w, i) => (
                  <span key={i} className="text-2xl font-bold">
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
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          )}
        </div>
      </ScrollArea>
      {word && (
        <Button
          onClick={onClear}
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-transparent"
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