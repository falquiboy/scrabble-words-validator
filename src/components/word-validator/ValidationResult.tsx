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
      className={`h-40 rounded-md border border-gray-200 ${
        result.isValid ? "bg-scrabble-valid" : "bg-scrabble-invalid"
      } text-white`}
    >
      <div className="p-4 min-h-full flex items-center">
        <div className="relative w-full" onClick={onEditStart}>
          <div className="flex flex-wrap gap-3">
            {word.split(" ").map((w, i) => (
              <span key={i} className="text-4xl font-bold">{w}</span>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ValidationResult;