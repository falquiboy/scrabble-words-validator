import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationResultProps {
  word: string;
  result: {
    isValid: boolean;
    checked: boolean;
    words: string[];
  };
  onEditStart: () => void;
}

const ValidationResult = ({ word, result, onEditStart }: ValidationResultProps) => {
  if (!result.checked) return null;

  return (
    <ScrollArea 
      className={`rounded-xl transition-colors duration-300 ${
        result.isValid ? "bg-scrabble-valid" : "bg-scrabble-invalid"
      }`}
    >
      <div className="p-4 min-h-[200px] flex items-center justify-center">
        <div 
          className="relative w-full cursor-pointer" 
          onClick={onEditStart}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {word.split(" ").map((w, i) => (
              <span 
                key={i} 
                className="text-5xl font-bold text-white tracking-wide"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ValidationResult;