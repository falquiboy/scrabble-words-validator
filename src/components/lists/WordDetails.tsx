import React from 'react';
import { Check, X } from 'lucide-react';

interface WordInfo {
  word: string;
  isValid: boolean;
  anagrams: string[];
  subanagrams: string[];
  definition?: string;
}

interface WordDetailsProps {
  wordInfo: WordInfo;
}

const WordDetails: React.FC<WordDetailsProps> = ({ wordInfo }) => {
  const { word, isValid, anagrams, subanagrams } = wordInfo;

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Word validation result */}
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${isValid ? 'bg-green-100' : 'bg-red-100'}`}>
          {isValid ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <X className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{word}</h3>
          <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? 'Palabra válida para Scrabble' : 'No es válida para Scrabble'}
          </p>
        </div>
      </div>

      {/* Anagrams section */}
      {anagrams.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Anagramas ({anagrams.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {anagrams.map((anagram, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200 cursor-pointer"
                onClick={() => window.open(`https://dle.rae.es/${anagram.toLowerCase()}`, '_blank')}
              >
                {anagram}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Subanagrams section */}
      {subanagrams.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Subanagramas ({subanagrams.length})
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {subanagrams.map((subanagram, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md hover:bg-purple-200 cursor-pointer"
                onClick={() => window.open(`https://dle.rae.es/${subanagram.toLowerCase()}`, '_blank')}
              >
                {subanagram}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="text-xs text-gray-500 border-t pt-2">
        💡 Haz clic en cualquier palabra para ver su definición en el DLE
      </div>
    </div>
  );
};

export default WordDetails;