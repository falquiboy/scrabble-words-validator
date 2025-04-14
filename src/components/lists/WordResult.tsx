
import React from 'react';

interface WordResultProps {
  word: string;
}

const WordResult = ({ word }: WordResultProps) => {
  const raeUrl = `https://dle.rae.es/${encodeURIComponent(word)}`;
  
  return (
    <a
      href={raeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-50 hover:bg-gray-100 p-2 rounded text-center transition-colors font-jetbrains"
      aria-label={`Buscar "${word}" en el diccionario RAE`}
    >
      {word}
    </a>
  );
};

export default WordResult;
