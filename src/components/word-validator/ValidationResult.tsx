
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toDisplayFormat } from "@/utils/digraphs";
import { Check, X } from "lucide-react";

interface ValidationResultProps {
  word: string;
  result: {
    isValid: boolean;
    checked: boolean;
    words: string[];
    wordStatuses?: boolean[]; // Individual word validity status
  };
}

const ValidationResult = ({
  word,
  result
}: ValidationResultProps) => {
  if (!result.checked) return null;
  
  // Determine if we're showing multiple words
  const isMultipleWords = result.words.length > 1;
  
  return (
    <ScrollArea className={`h-40 rounded-md border border-gray-200 ${result.isValid ? "bg-scrabble-valid" : "bg-scrabble-invalid"} text-white relative`}>
      <div className="p-4 min-h-full flex items-center py-0 my-0">
        <div className="relative w-full">
          {isMultipleWords ? (
            // Multiple words: display one per line
            <div className="flex flex-col gap-2">
              {result.words.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-3xl font-bold">
                    {toDisplayFormat(w)}
                  </span>
                  {/* Show individual word status if available */}
                  {result.wordStatuses && (
                    <span className={`${result.wordStatuses[i] ? "text-green-200" : "text-red-200"}`}>
                      {result.wordStatuses[i] ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <X className="w-6 h-6" />
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Single word: display centered and larger
            <div className="flex justify-center">
              <span className="text-4xl font-bold">
                {result.words[0] && toDisplayFormat(result.words[0])}
              </span>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default ValidationResult;
