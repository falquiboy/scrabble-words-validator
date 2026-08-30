
import React from 'react';
import { toDisplayFormat } from "@/utils/digraphs";
import { useLexicon } from '@/lexicon/LexiconContext';
import LexiconBadge from '@/components/LexiconBadge';

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
  const { mode, membership } = useLexicon();
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
  
  const wordClass = (index: number, currentWord: string) => {
    if (!result.wordStatuses?.[index]) return 'bg-scrabble-invalid text-white';
    if (mode === 'dem' && membership(currentWord) === 'new-dem') {
      return 'border border-rose-400 bg-rose-100 text-rose-950';
    }
    if (mode === 'hybrid' && membership(currentWord) === 'new-2027') {
      return 'border border-amber-400 bg-amber-100 text-amber-950';
    }
    return 'bg-scrabble-valid text-white';
  };

  return (
    <div className={`${getContainerHeight()} rounded-md border border-gray-200 bg-white relative overflow-hidden`}>
      <div className="p-4 h-full flex items-center">
        <div className="relative w-full">
          {isMultipleWords ? (
            // Multiple words: display one per line without indicators
            <div className="flex flex-col gap-1.5">
              {result.words.map((w, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-md px-3 py-1 ${wordClass(i, w)}`}>
                  <span className="text-3xl font-bold flex-1">
                    {toDisplayFormat(w)}
                  </span>
                  <LexiconBadge word={w} />
                </div>
              ))}
            </div>
          ) : (
            // Single word: display centered and larger
            <div className={`flex justify-center items-center gap-3 h-full rounded-md p-4 ${wordClass(0, result.words[0])}`}>
              <span className="text-4xl font-bold">
                {result.words[0] && toDisplayFormat(result.words[0])}
              </span>
              {result.words[0] && <LexiconBadge word={result.words[0]} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationResult;
