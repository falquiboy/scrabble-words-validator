import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toDisplayFormat } from "@/utils/digraphs";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

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
      } text-white relative group`}
    >
      <div className="p-4 min-h-full flex items-center">
        <div className="relative w-full">
          <div className="flex flex-wrap gap-3">
            {result.words.map((w, i) => (
              <span key={i} className="text-4xl font-bold">
                {toDisplayFormat(w)}
              </span>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onEditStart}
          >
            <Edit2 className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ValidationResult;