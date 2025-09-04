
import React from 'react';
import { toDisplayFormat } from "@/utils/digraphs";

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
  
  // Calculate dynamic height based on number of words
  // Single word: ~140px (h-35), Multiple words: adjust based on count
  const getContainerHeight = () => {
    if (!isMultipleWords) return "h-35"; // ~140px for single word
    const wordCount = result.words.length;
    if (wordCount <= 2) return "h-32"; // ~128px for 2 words
    if (wordCount <= 3) return "h-44"; // ~176px for 3 words
    if (wordCount <= 4) return "h-56"; // ~224px for 4 words
    return "h-64"; // ~256px for 5+ words
  };
  
  return (
    <div className={`${getContainerHeight()} rounded-md border border-gray-200 ${result.isValid ? "bg-scrabble-valid" : "bg-scrabble-invalid"} text-white relative overflow-hidden`}>
      <div className="p-4 h-full flex items-center">
        <div className="relative w-full">
          {isMultipleWords ? (
            // Multiple words: display one per line without indicators
            <div className="flex flex-col gap-1.5">
              {result.words.map((w, i) => (
                <div key={i} className="flex items-center">
                  <span className="text-3xl font-bold">
                    {toDisplayFormat(w)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // Single word: display centered and larger
            <div className="flex justify-center items-center h-full">
              <span className="text-4xl font-bold">
                {result.words[0] && toDisplayFormat(result.words[0])}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationResult;
