import React, { useState } from 'react';
import { Loader, ChevronDown, ChevronRight } from "lucide-react";
import ExtendedWordView from './ExtendedWordView';
import { toDisplayFormat } from "@/utils/digraphs";
import { AnagramWordInfo } from '@/utils/anagramWordData';
import { highlightPatternMatch } from '@/utils/wildcardHighlighting';

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
  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Toggle section collapse/expand
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin mr-2" size={20} />
        <span className="text-gray-600">Buscando anagramas...</span>
      </div>
    );
  }

  const renderWordSection = (title: string, words: string[], color: string = 'blue', sectionId?: string, collapsible: boolean = false, wordArray?: string[]) => {
    if (words.length === 0) return null;

    const isCollapsed = sectionId ? collapsedSections.has(sectionId) : false;

    return (
      <div className="space-y-3">
        {collapsible && sectionId ? (
          <button
            onClick={() => toggleSection(sectionId)}
            className={`sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm flex items-center gap-2 font-semibold text-${color}-600 text-sm hover:text-${color}-700 transition-colors py-2 -mx-4 px-4 mb-2`}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
            {title} ({words.length})
          </button>
        ) : (
          <h3 className={`sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm font-semibold text-${color}-600 text-sm py-2 -mx-4 px-4 mb-2`}>
            {title} ({words.length})
          </h3>
        )}
        
        {!isCollapsed && (
          <div className="grid gap-3 grid-cols-1">
            {words.map((word, index) => {
              const displayWord = toDisplayFormat(word);
              const wordInfo = wordsData.get(displayWord.toUpperCase());
              const highlighted = getHighlightedWord(displayWord, wordArray || words); // Use correct highlighting based on context
              
              return (
                <ExtendedWordView
                  key={index}
                  word={displayWord} // Use display format for user-facing display
                  wordInfo={wordInfo}
                  isLoading={isLoadingData && !wordInfo}
                  highlightedWord={highlighted} // Already converted by highlightWildcardLetter
                />
              );
            })}
          </div>
        )}
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
  
  // Helper function to get correct highlighting based on search type and word context
  const getHighlightedWord = (displayWord: string, currentWordArray: string[]) => {
    // For pattern matches, always use pattern highlighting
    if (currentWordArray === results.patternMatches) {
      // For pattern searches with rack letters, extract pattern and rack parts
      const [patternPart, rackPart] = searchTerm.includes(',') ? 
        searchTerm.split(',') : [searchTerm, ''];
      return highlightPatternMatch(displayWord, patternPart, rackPart || '');
    } else {
      // For wildcard/exact matches, use wildcard highlighting
      return highlightWildcardLetter(displayWord, searchTerm);
    }
  };

  return (
    <div className="space-y-6">

      {/* Pattern results (for pattern searches) - Collapsible if many results */}
      {isPatternSearch && (
        <div style={{position: 'relative', zIndex: 25}}>
          {renderWordSection(
            "Coincidencias de patrón", 
            results.patternMatches, 
            "purple",
            "pattern-matches",
            results.patternMatches.length > 10,
            results.patternMatches
          )}
        </div>
      )}

      {/* Exact matches - Collapsible if many results */}
      {!isPatternSearch && (
        <div style={{position: 'relative', zIndex: 25}}>
          {renderWordSection(
            "Anagramas exactos", 
            results.exactMatches, 
            "green",
            "exact-matches",
            results.exactMatches.length > 10,
            results.exactMatches
          )}
        </div>
      )}

      {/* Wildcard matches - Collapsible if many results */}
      {!isPatternSearch && (
        <div style={{position: 'relative', zIndex: 24}}>
          {renderWordSection(
            "Con comodines", 
            results.wildcardMatches, 
            "blue",
            "wildcard-matches",
            results.wildcardMatches.length > 10,
            results.wildcardMatches
          )}
        </div>
      )}

      {/* Additional wildcard matches - Collapsible if many results */}
      {!isPatternSearch && (
        <div style={{position: 'relative', zIndex: 23}}>
          {renderWordSection(
            "Comodines adicionales", 
            results.additionalWildcardMatches, 
            "indigo",
            "additional-wildcard-matches",
            results.additionalWildcardMatches.length > 10,
            results.additionalWildcardMatches
          )}
        </div>
      )}

      {/* Shorter matches - Collapsible */}
      {!isPatternSearch && showShorter && (
        <div style={{position: 'relative', zIndex: 22}}>
          {renderWordSection(
            "Palabras más cortas", 
            results.shorterMatches, 
            "orange",
            "shorter-matches",
            true,
            results.shorterMatches
          )}
        </div>
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