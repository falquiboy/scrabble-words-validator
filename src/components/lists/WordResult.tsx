
import React from 'react';
import LexiconBadge from '@/components/LexiconBadge';

interface WordResultProps {
  word: string;
  onClick?: (word: string) => void;
}

const WordResult = ({ word, onClick }: WordResultProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(word);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className="bg-gray-50 hover:bg-gray-100 p-2 rounded text-center transition-colors font-semibold w-full"
      aria-label={`Ver información de "${word}"`}
    >
      <span className="inline-flex items-center justify-center gap-1.5">
        {word}
        <LexiconBadge word={word} />
      </span>
    </button>
  );
};

export default WordResult;
