import React from 'react';

interface DisplayTextProps {
  word: string;
  onEditStart: () => void;
}

const DisplayText = ({ word, onEditStart }: DisplayTextProps) => {
  return (
    <div className="relative" onClick={onEditStart}>
      <div className="flex flex-wrap gap-2">
        {word.split(" ").map((w, i) => (
          <span key={i} className="text-2xl font-bold">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DisplayText;