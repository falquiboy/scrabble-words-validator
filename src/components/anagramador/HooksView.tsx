import React from 'react';
import { Loader, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toDisplayFormat } from "@/utils/digraphs";
import { HookInfo, processHooks } from '@/utils/hooksData';

interface HooksViewProps {
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
  onCopyAll: () => void;
  showShorter: boolean;
  hooksData: Map<string, HookInfo>;
  isLoadingHooks: boolean;
}

const HooksView: React.FC<HooksViewProps> = ({
  isLoading,
  searchTerm,
  results,
  highlightWildcardLetter,
  onCopyAll,
  showShorter,
  hooksData,
  isLoadingHooks
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin mr-2" size={20} />
        <span className="text-gray-600">Buscando anagramas...</span>
      </div>
    );
  }

  const renderHookLetter = (letter: string, isLeft: boolean) => {
    return (
      <span
        key={letter}
        className={`inline-block px-1 py-0.5 text-xs font-mono bg-blue-100 text-blue-700 rounded mx-0.5 ${
          isLeft ? 'mr-1' : 'ml-1'
        }`}
        title={`Hook: +${letter}`}
      >
        {letter.toUpperCase()}
      </span>
    );
  };

  const renderWordWithHooks = (word: string, originalWord: string) => {
    const displayWord = toDisplayFormat(word);
    const hookInfo = hooksData.get(displayWord.toUpperCase());
    const highlighted = highlightWildcardLetter(word, searchTerm);

    if (!hookInfo || (!hookInfo.hasExternalHooks && !hookInfo.hasInternalHooks)) {
      // No hooks available
      return (
        <div className="flex items-center justify-center py-2 px-3 bg-gray-50 rounded border">
          <span className="text-gray-500 text-sm font-mono">
            {highlighted}
          </span>
          <span className="text-xs text-gray-400 ml-2">(sin ganchos)</span>
        </div>
      );
    }

    const hooks = processHooks(hookInfo);

    return (
      <div className="flex items-center justify-center py-2 px-3 bg-white rounded border hover:shadow-sm transition-shadow">
        <div className="flex items-center">
          {/* Left internal hook indicator */}
          {hooks.hasLeftInternal && (
            <span 
              className="text-green-600 font-bold mr-1" 
              title={`Gancho interno izquierdo: ${hooks.leftInternalLetters.join(', ')}`}
            >
              &lt;
            </span>
          )}

          {/* Left external hooks */}
          <div className="flex flex-wrap items-center">
            {hooks.leftExternal.map(letter => renderHookLetter(letter, true))}
          </div>

          {/* The word itself */}
          <span className="font-mono font-semibold text-lg mx-2">
            {highlighted}
          </span>

          {/* Right external hooks */}
          <div className="flex flex-wrap items-center">
            {hooks.rightExternal.map(letter => renderHookLetter(letter, false))}
          </div>

          {/* Right internal hook indicator */}
          {hooks.hasRightInternal && (
            <span 
              className="text-green-600 font-bold ml-1"
              title={`Gancho interno derecho: ${hooks.rightInternalLetters.join(', ')}`}
            >
              &gt;
            </span>
          )}
        </div>

        {/* Hook summary */}
        <div className="ml-4 text-xs text-gray-500">
          {hookInfo.hasExternalHooks && (
            <span className="bg-blue-50 px-2 py-1 rounded mr-1">
              {hooks.leftExternal.length + hooks.rightExternal.length} ext
            </span>
          )}
          {hookInfo.hasInternalHooks && (
            <span className="bg-green-50 px-2 py-1 rounded">
              {(hooks.hasLeftInternal ? 1 : 0) + (hooks.hasRightInternal ? 1 : 0)} int
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderWordSection = (title: string, words: string[], color: string = 'blue') => {
    if (words.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className={`font-semibold text-${color}-600 text-sm`}>
          {title} ({words.length})
        </h3>
        <div className="space-y-2">
          {words.map((word, index) => (
            <div key={index}>
              {renderWordWithHooks(word, searchTerm)}
            </div>
          ))}
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

  const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');

  return (
    <div className="space-y-6">
      {/* Header with copy button and legend */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Vista de Ganchos</span> - Letras para extender palabras
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyAll}
            className="flex items-center space-x-2"
          >
            <Copy size={16} />
            <span>Copiar todo</span>
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <div className="flex items-center space-x-1">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">A</span>
            <span>Gancho externo</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-600 font-bold">&lt;</span>
            <span>Gancho interno izquierdo</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-600 font-bold">&gt;</span>
            <span>Gancho interno derecho</span>
          </div>
        </div>
      </div>

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

      {/* Loading indicator for hooks data */}
      {isLoadingHooks && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
          <Loader className="animate-spin mr-2" size={16} />
          Cargando información de ganchos...
        </div>
      )}
    </div>
  );
};

export default HooksView;