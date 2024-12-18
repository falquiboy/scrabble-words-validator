import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import CustomKeyboard from "../anagramador/CustomKeyboard";

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
  const [showKeyboard, setShowKeyboard] = useState(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (word) {
          onWordChange("");
        }
        onEditStart();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
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
        const upperChar = char.toUpperCase();
        if (upperChar === 'Ñ' || upperChar === 'ñ') {
          return 'Ñ';
        }
        return upperChar
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .normalize('NFC');
      })
      .join('')
      .replace(/[^A-ZÑ\s]/g, '')
      .replace(/[KW]/g, '');
    
    onWordChange(value);
    
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onValidate();
    }
  };

  const handleCustomKeyPress = (key: string) => {
    if (key === "Backspace") {
      onWordChange(word.slice(0, -1));
      return;
    }
    const currentValue = word;
    const newValue = currentValue + key;
    const validValue = newValue.replace(/[^A-ZÑ\s]/g, '').toUpperCase();
    onWordChange(validValue);
  };

  // Prevent mobile keyboard
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          input.blur();
        }
      });
    }
  }, [inputRef]);

  return (
    <div className="relative">
      <ScrollArea className={`h-24 rounded-md ${getInputBackground()}`}>
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
      <CustomKeyboard 
        onKeyPress={handleCustomKeyPress} 
        onClear={onClear}
        onToggle={() => setShowKeyboard(!showKeyboard)}
        showKeyboard={showKeyboard}
      />
    </div>
  );
};

export default WordInput;