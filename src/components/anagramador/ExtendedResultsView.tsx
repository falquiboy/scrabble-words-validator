import React, { useEffect, useMemo, useState } from 'react';
import { Loader, ChevronDown, ChevronRight } from "lucide-react";
import ExtendedWordView from './ExtendedWordView';
import { toDisplayFormat } from "@/utils/digraphs";
import { AnagramWordInfo } from '@/utils/anagramWordData';
import { highlightPatternMatch } from '@/utils/wildcardHighlighting';
import { isPatternQuery, parseUserQuery } from '@/utils/queryLanguage.mjs';

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
  onRequestWords: (words: string[]) => void;
}

const INITIAL_VISIBLE_WORDS = 225;
const VISIBLE_WORD_PAGE = 225;

const WordInfoRequester: React.FC<{
  words: string[];
  onRequestWords: (words: string[]) => void;
}> = ({ words, onRequestWords }) => {
  const wordKey = useMemo(() => words.join('|'), [words]);

  useEffect(() => {
    if (wordKey) onRequestWords(wordKey.split('|'));
  }, [onRequestWords, wordKey]);

  return null;
};

const ExtendedResultsView: React.FC<ExtendedResultsViewProps> = ({
  isLoading,
  searchTerm,
  results,
  highlightWildcardLetter,
  showShorter,
  wordsData,
  isLoadingData,
  onRequestWords
}) => {
  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setVisibleCounts({});
    setCollapsedSections(new Set());
  }, [searchTerm]);

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
    const visibilityKey = sectionId || title;
    const visibleCount = visibleCounts[visibilityKey] || INITIAL_VISIBLE_WORDS;
    const visibleWords = words.slice(0, visibleCount);
    const remainingWords = words.length - visibleWords.length;

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
            <WordInfoRequester words={visibleWords} onRequestWords={onRequestWords} />
            {visibleWords.map((word) => {
              const displayWord = toDisplayFormat(word);
              const wordInfo = wordsData.get(displayWord.toUpperCase());
              const highlighted = getHighlightedWord(displayWord, wordArray || words); // Use correct highlighting based on context
              
              return (
                <ExtendedWordView
                  key={`${visibilityKey}:${word}`}
                  word={displayWord} // Use display format for user-facing display
                  wordInfo={wordInfo}
                  isLoading={isLoadingData && !wordInfo}
                  highlightedWord={highlighted} // Already converted by highlightWildcardLetter
                />
              );
            })}
            {remainingWords > 0 && (
              <button
                type="button"
                onClick={() => setVisibleCounts((previous) => ({
                  ...previous,
                  [visibilityKey]: Math.min(words.length, visibleCount + VISIBLE_WORD_PAGE)
                }))}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Mostrar {Math.min(VISIBLE_WORD_PAGE, remainingWords)} más ({remainingWords} pendientes)
              </button>
            )}
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

  const isPatternSearch = isPatternQuery(searchTerm);
  
  // Helper function to get correct highlighting based on search type and word context
  const getHighlightedWord = (displayWord: string, currentWordArray: string[]) => {
    // For pattern matches, always use pattern highlighting
    if (currentWordArray === results.patternMatches) {
      // For pattern searches with rack letters, extract pattern and rack parts
      const query = parseUserQuery(searchTerm);
      return highlightPatternMatch(displayWord, query.pattern, query.rack);
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
