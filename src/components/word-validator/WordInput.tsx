import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import InputField from './word-input/InputField';
import DisplayText from './word-input/DisplayText';
import CursorManager from './word-input/CursorManager';
import KeyboardHandler from './word-input/KeyboardHandler';

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
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const { handleCustomKeyPress } = KeyboardHandler({
    inputRef,
    word,
    cursorPosition,
    onWordChange,
    onValidate,
    setCursorPosition
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart || 0;
    
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
      .replace(/[^A-ZÑ\s]/g, '');
    
    onWordChange(value);
    
    requestAnimationFrame(() => {
      input.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onValidate();
    }
  };

  const getInputBackground = () => {
    if (!result.checked) return "bg-white text-black";
    return result.isValid 
      ? "bg-scrabble-valid text-white" 
      : "bg-scrabble-invalid text-white";
  };

  return (
    <div className="relative">
      <CursorManager inputRef={inputRef} setCursorPosition={setCursorPosition} />
      <ScrollArea className={`h-24 rounded-md ${getInputBackground()}`}>
        <div className={`p-3 min-h-full ${getInputBackground()}`}>
          {result.checked && !isEditing ? (
            <DisplayText word={word} onEditStart={onEditStart} />
          ) : (
            <InputField
              word={word}
              inputRef={inputRef}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              getInputBackground={getInputBackground}
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