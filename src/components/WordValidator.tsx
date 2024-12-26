import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";

interface WordInputProps {
  onValidate: (word: string) => void;
  isLoading: boolean;
  error: string | null;
}

const WordInput = ({ onValidate, isLoading, error }: WordInputProps) => {
  const [word, setWord] = React.useState("");
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const [isEditing, setIsEditing] = React.useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getInputBackground = () => {
    if (isValid === null) return "bg-white text-black";
    return isValid 
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
    
    setWord(value);
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const handleValidate = () => {
    if (word.trim()) {
      onValidate(word);
      setIsEditing(false);
    }
  };

  const handleClear = () => {
    setWord("");
    setIsValid(null);
    setIsEditing(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <ScrollArea className={`h-40 rounded-md border border-gray-200 ${getInputBackground()}`}>
        <div className={`p-3 min-h-full ${getInputBackground()}`}>
          {!isEditing ? (
            <div 
              className="relative" 
              onClick={() => setIsEditing(true)}
            >
              <div className="flex flex-wrap gap-2">
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
              placeholder="Escribe una o más palabras..."
              value={word}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValidate();
                }
              }}
              className={`w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400`}
              onBlur={() => {
                if (!word.trim()) {
                  setIsEditing(false);
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
          onClick={handleClear}
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-transparent"
          type="button"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
          ) : isValid !== null ? (
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