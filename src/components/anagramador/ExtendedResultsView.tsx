import React from 'react';
import { Loader } from "lucide-react";
import ExtendedWordView from './ExtendedWordView';
import { toDisplayFormat } from "@/utils/digraphs";
import { AnagramWordInfo } from '@/utils/anagramWordData';

interface ExtendedResultsViewProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    shorterMatches: string[];
    patternMatches: string[];
  };
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  showShorter: boolean;
  wordsData: Map<string, AnagramWordInfo>;
  isLoadingData: boolean;
}

const ExtendedResultsView: React.FC<ExtendedResultsViewProps> = ({
  isLoading,
  searchTerm,
  results,
  highlightWildcardLetter,
  showShorter,
  wordsData,
  isLoadingData
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin mr-2" size={20} />
        <span className="text-gray-600">Buscando anagramas...</span>
      </div>
    );
  }

  const renderWordSection = (title: string, words: string[], color: string = 'blue') => {
    if (words.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className={`font-semibold text-${color}-600 text-sm`}>
          {title} ({words.length})
        </h3>
        <div className="grid gap-3 grid-cols-1">
          {words.map((word, index) => {
            const displayWord = toDisplayFormat(word);
            const wordInfo = wordsData.get(displayWord.toUpperCase());
            const highlighted = highlightWildcardLetter(word, searchTerm);
            
            return (
              <ExtendedWordView
                key={index}
                word={displayWord}
                wordInfo={wordInfo}
                isLoading={isLoadingData && !wordInfo}
                highlightedWord={highlighted}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const hasAnyResults = results.exactMatches.length > 0 ||
                        results.wildcardMatches.length > 0 ||
                        results.additionalWildcardMatches.length > 0 ||
                        results.shorterMatches.length > 0 ||
                        results.patternMatches.length > 0;

  if (!hasAnyResults) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se encontraron resultados</p>
      </div>
    );
  }

  const isPatternSearch = searchTerm.includes('*') || searchTerm.includes('.') || searchTerm.includes('-');

  return (
    <div className="space-y-6">

      {/* Pattern results (for pattern searches) */}
      {isPatternSearch && renderWordSection(
        "Coincidencias de patrón", 
        results.patternMatches, 
        "purple"
      )}

      {/* Exact matches */}
      {!isPatternSearch && renderWordSection(
        "Anagramas exactos", 
        results.exactMatches, 
        "green"
      )}

      {/* Wildcard matches */}
      {!isPatternSearch && renderWordSection(
        "Con comodines", 
        results.wildcardMatches, 
        "blue"
      )}

      {/* Additional wildcard matches */}
      {!isPatternSearch && renderWordSection(
        "Comodines adicionales", 
        results.additionalWildcardMatches, 
        "indigo"
      )}

      {/* Shorter matches */}
      {!isPatternSearch && showShorter && renderWordSection(
        "Palabras más cortas", 
        results.shorterMatches, 
        "orange"
      )}

      {/* Loading indicator for data */}
      {isLoadingData && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
          <Loader className="animate-spin mr-2" size={16} />
          Cargando información adicional...
        </div>
      )}
    </div>
  );
};

export default ExtendedResultsView;