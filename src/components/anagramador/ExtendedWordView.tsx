import React from 'react';
import { AnagramWordInfo } from '@/utils/anagramWordData';
import { ExternalLink } from 'lucide-react';

interface ExtendedWordViewProps {
  word: string;
  wordInfo?: AnagramWordInfo;
  isLoading?: boolean;
  highlightedWord?: React.ReactNode;
}

const ExtendedWordView: React.FC<ExtendedWordViewProps> = ({
  word,
  wordInfo,
  isLoading,
  highlightedWord
}) => {
  const handleRAEClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://dle.rae.es/${word.toLowerCase()}`, '_blank');
  };

  const getWordTypeColor = (type?: string) => {
    switch (type) {
      case 'femenino': return 'text-pink-600 bg-pink-50';
      case 'plural': return 'text-purple-600 bg-purple-50';
      case 'conjugación': return 'text-blue-600 bg-blue-50';
      case 'variante': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{highlightedWord || word}</span>
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <div className="text-xs text-gray-500">Cargando información...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Word and RAE link */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-lg">{highlightedWord || word}</span>
          {wordInfo?.isScrabbleValid && (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Válida para Scrabble"></span>
          )}
        </div>
        <button
          onClick={handleRAEClick}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="Ver en RAE"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {/* Word information */}
      {wordInfo ? (
        <div className="space-y-1 text-sm">
          {/* Lemma */}
          {wordInfo.lemma && wordInfo.lemma !== word.toUpperCase() && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs">Lema:</span>
              <span className="font-medium text-gray-700">{wordInfo.lemma.toLowerCase()}</span>
            </div>
          )}

          {/* Part of speech and word type */}
          <div className="flex items-center space-x-2 flex-wrap">
            {wordInfo.partOfSpeech && (
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                {wordInfo.partOfSpeech}
              </span>
            )}
            {wordInfo.wordType && wordInfo.wordType !== 'base' && (
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getWordTypeColor(wordInfo.wordType)}`}>
                {wordInfo.wordType}
              </span>
            )}
          </div>

          {/* Short definition */}
          {wordInfo.shortDefinition && (
            <div className="text-xs text-gray-600 italic mt-2 leading-relaxed">
              "{wordInfo.shortDefinition}"
            </div>
          )}

          {/* No info available */}
          {!wordInfo.lemma && !wordInfo.partOfSpeech && !wordInfo.shortDefinition && wordInfo.isScrabbleValid && (
            <div className="text-xs text-gray-500 italic">
              Información no disponible en diccionario local
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-red-500">
          No válida para Scrabble
        </div>
      )}
    </div>
  );
};

export default ExtendedWordView;