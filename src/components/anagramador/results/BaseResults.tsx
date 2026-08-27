
import React, { useState, useEffect } from 'react';
import { processDigraphs, getInternalLength, toDisplayFormat } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";
import {
  calculatePotentialValue,
  calculateLeave,
  CURRENT_LEAVE_GENERATION,
  getBatchGenerationLeaveValues,
} from "@/utils/leavesData";
import { ChevronDown, ChevronRight } from "lucide-react";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import LexiconBadge from '@/components/LexiconBadge';
import { isPatternQuery, parseUserQuery } from '@/utils/queryLanguage.mjs';

const LARGE_GROUP_BATCH_SIZE = 500;

// Utilidad para extraer información de búsqueda
const parseSearchTerm = (searchTerm: string, title?: string) => {
  const query = parseUserQuery(searchTerm);
  const isPatternSearch = query.kind === 'pattern';
  const normalizedTitle = title?.toLocaleLowerCase('es') || '';
  
  // Detectar si tiene restricción de rack (patrón con coma)
  const hasRackRestriction = isPatternSearch && !!query.rack;
  
  // Detectar si son subanagramas reales (palabras más cortas)
  const isShorterWords = normalizedTitle.includes("más cortas") ||
                        normalizedTitle.includes("cortas") ||
                        normalizedTitle.includes("shorter") ||
                        normalizedTitle.includes("ficha valiosa") ||
                        normalizedTitle.includes("subanagram") ||
                        normalizedTitle.includes("resultados con comodín") ||
                        normalizedTitle.includes("resultados sin comodín");
  
  let rack = '';
  if (hasRackRestriction) {
    // Extraer rack de patrón como ".R.Z*,AEEBRS"
    rack = query.rack;
  } else if (!isPatternSearch) {
    // Búsqueda de anagrama normal
    rack = query.letters;
  }
  
  return {
    isPatternSearch,
    hasRackRestriction,
    rack: rack.trim(),
    shouldShowEquityAndResidue: isShorterWords && !hasRackRestriction // Solo mostrar en subanagramas, NO en patrones con rack
  };
};

interface BaseResultsProps {
  matches: string[];
  title: string;
  highlightWildcardLetter?: (word: string, originalWord: string) => React.ReactNode;
  searchTerm?: string;
  isShortMode?: boolean;
  sortAscending?: boolean;
  sortByEquity?: boolean; // Nueva prop para ordenar por equity
  unifiedEquityView?: boolean; // Nueva prop para vista unificada con residuos
}

// Componente para mostrar una palabra con su equity
const WordWithEquity: React.FC<{
  word: string;
  displayWord: string;
  searchTerm?: string;
  title?: string;
  highlightWildcardLetter?: (word: string, originalWord: string) => React.ReactNode;
  index: number;
  length: number;
  showResidue?: boolean; // Nueva prop para mostrar residuo en lugar de equity
}> = ({ word, displayWord, searchTerm, title, highlightWildcardLetter, index, length, showResidue = false }) => {
  const [equity, setEquity] = useState<number | null>(null);
  const [residue, setResidue] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  
  const query = parseUserQuery(searchTerm || '');
  const scoringRack = query.kind === 'anagram' ? query.letters : query.rack;
  const baseScore = calculateWordScore(displayWord, scoringRack);
  const isSubanagram = scoringRack
    && getInternalLength(displayWord) < getInternalLength(scoringRack);

  useEffect(() => {
    const calculateEquity = async () => {
      // La lista simple sólo muestra palabras. Equity y residuo pertenecen a
      // su vista exclusiva y no deben calcularse ni filtrarse por el título.
      if (!showResidue) {
        setEquity(baseScore);
        setResidue('');
        setIsCalculating(false);
        return;
      }

      // Early return if search term contains pattern characters
      if (searchTerm && isPatternQuery(searchTerm)) {
        setEquity(baseScore);
        if (showResidue) {
          setResidue('');
        }
        return;
      }

      if (!isSubanagram) {
        setEquity(baseScore);
        if (showResidue) {
          setResidue(''); // No residue for non-subanagrams
        }
        return;
      }

      setIsCalculating(true);
      try {
        const potentialValue = await calculatePotentialValue(
          baseScore, 
          scoringRack,
          displayWord.toUpperCase(),
          scoringRack,
          CURRENT_LEAVE_GENERATION,
        );
        setEquity(potentialValue);

        // Calculate residue if needed
        if (showResidue) {
          const searchInfo = parseSearchTerm(searchTerm, title);
          if (searchInfo.shouldShowEquityAndResidue && searchInfo.rack) {
            const leave = calculateLeave(searchInfo.rack, displayWord.toUpperCase(), scoringRack);
            setResidue(leave);
          } else {
            setResidue(''); // No residue for patterns without rack
          }
        }
      } catch (error) {
        console.error('Error calculating equity:', error);
        setEquity(baseScore); // Fallback to base score
        if (showResidue) {
          setResidue('');
        }
      } finally {
        setIsCalculating(false);
      }
    };

    calculateEquity();
  }, [baseScore, searchTerm, scoringRack, displayWord, isSubanagram, showResidue, title]);

  return (
    <div
      key={`word-${length}-${index}`}
      className={`p-1.5 text-lg ${showResidue ? 'block w-full' : ''}`}
    >
      <span className="flex items-center gap-2">
        {showResidue && (
          <span className={`text-sm ${isSubanagram && equity !== baseScore ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
            {isCalculating ? '...' : equity || baseScore}
          </span>
        )}
        <a
          href={`https://dle.rae.es/?w=${displayWord}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors"
        >
          {highlightWildcardLetter && searchTerm 
            ? highlightWildcardLetter(displayWord, searchTerm)
            : displayWord}
        </a>
        <LexiconBadge word={word} />
        {showResidue && (
          <span className={`text-sm ${isSubanagram && equity !== baseScore ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
            ({isCalculating ? '...' : residue ? residue : equity || baseScore})
          </span>
        )}
      </span>
    </div>
  );
};

export const BaseResults = ({ 
  matches, 
  title, 
  highlightWildcardLetter, 
  searchTerm, 
  isShortMode,
  sortAscending = false,
  sortByEquity = false,
  unifiedEquityView = false
}: BaseResultsProps) => {
  const [equityValues, setEquityValues] = useState<Map<string, number>>(new Map());
  const [isCalculatingEquities, setIsCalculatingEquities] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [visibleWordCounts, setVisibleWordCounts] = useState<Record<string, number>>({});
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);

  useEffect(() => {
    setIsSectionExpanded(true);
  }, [title, searchTerm]);

  // Función para alternar expansión de grupos
  const toggleGroupExpansion = (length: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(length)) {
        newSet.delete(length);
      } else {
        newSet.add(length);
      }
      return newSet;
    });
  };

  // Inicializar grupos expandidos por defecto (solo la primera vez)
  useEffect(() => {
    const groupedByLength = matches.reduce((acc, word) => {
      const length = getInternalLength(word);
      if (!acc[length]) {
        acc[length] = [];
      }
      acc[length].push(word);
      return acc;
    }, {} as Record<number, string[]>);

    const lengths = Object.keys(groupedByLength).map(Number).sort((a, b) => b - a);
    
    // Expandir automáticamente los primeros 2 grupos más largos
    const initialExpanded = new Set(lengths.slice(0, 2));
    setExpandedGroups(initialExpanded);
  }, [matches]);

  // Pre-calculate equity values for sorting when sortByEquity or unifiedEquityView is true
  useEffect(() => {
    // Solo calcular equity cuando el usuario lo solicite explícitamente
    if ((!sortByEquity && !unifiedEquityView) || !searchTerm) return;

    // Early return if search term contains pattern characters
    if (isPatternQuery(searchTerm)) {
      return;
    }

    const calculateAllEquities = async () => {
      setIsCalculatingEquities(true);
      const newEquityValues = new Map<string, number>();

      // Separar subanagramas y palabras normales
      const subanagrams: string[] = [];
      const normalWords: string[] = [];
      
      for (const word of matches) {
        const searchInfo = parseSearchTerm(searchTerm, title);
        const rackToUse = searchInfo.rack || searchTerm;
        const isSubanagram = getInternalLength(word) < getInternalLength(rackToUse);
        
        if (isSubanagram) {
          subanagrams.push(word);
        } else {
          normalWords.push(word);
        }
      }

      // Procesar palabras normales (solo base score)
      for (const word of normalWords) {
        const displayWord = toDisplayFormat(word);
        const baseScore = calculateWordScore(displayWord, searchTerm);
        newEquityValues.set(word, baseScore);
      }

      // Para subanagramas, usar batch query para optimizar
      if (subanagrams.length > 0) {
        console.log(`🚀 Calculating equity for ${subanagrams.length} subanagrams using batch optimization`);
        
        // Calcular todos los leaves necesarios
        const leavesToQuery: string[] = [];
        const wordToLeaveMap = new Map<string, string>();
        
        for (const word of subanagrams) {
          const displayWord = toDisplayFormat(word);
          const searchInfo = parseSearchTerm(searchTerm, title);
          const rackToUse = searchInfo.rack || searchTerm; // Fallback to searchTerm for anagrams
          const leave = calculateLeave(rackToUse, displayWord.toUpperCase(), searchTerm);
          leavesToQuery.push(leave);
          wordToLeaveMap.set(word, leave);
        }

        try {
          // Single batch query para todos los leaves
          const leaveValues = await getBatchGenerationLeaveValues(
            CURRENT_LEAVE_GENERATION,
            leavesToQuery,
          );
          
          // Calcular equity para cada subanagrama
          for (const word of subanagrams) {
            const displayWord = toDisplayFormat(word);
            const baseScore = calculateWordScore(displayWord, searchTerm);
            const leave = wordToLeaveMap.get(word)!;
            const leaveValue = leaveValues.get(leave);
            
            const equity = leaveValue !== null ? baseScore + leaveValue : baseScore;
            newEquityValues.set(word, Math.round(equity * 100) / 100);
          }
        } catch (error) {
          console.error('Error in batch equity calculation:', error);
          // Fallback: usar base scores
          for (const word of subanagrams) {
            const displayWord = toDisplayFormat(word);
            const baseScore = calculateWordScore(displayWord, searchTerm);
            newEquityValues.set(word, baseScore);
          }
        }
      }

      setEquityValues(newEquityValues);
      setIsCalculatingEquities(false);
      // Force re-render to apply sorting with calculated values
    };

    calculateAllEquities();
  }, [matches, searchTerm, sortByEquity, unifiedEquityView, title]);

  // Handle empty matches case - show only header
  if (matches.length === 0) {
    const isPatternResult = !!searchTerm && isPatternQuery(searchTerm);
    return (
      <div className="space-y-4 pb-8">
        <h3 className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm font-semibold text-lg py-2 -mx-4 px-4 mb-2">
          {isPatternResult
            ? title
            : title.includes("adicional")
            ? "0 palabras con letra adicional:" 
            : "0 palabras con todas las fichas:"
          }
        </h3>
      </div>
    );
  }

  // Handle unified equity view - all words sorted by absolute equity
  if (unifiedEquityView) {
    const searchInfo = parseSearchTerm(searchTerm, title);
    const sortedWords = [...matches].sort((a, b) => {
      const equityA = equityValues.get(a) || 0;
      const equityB = equityValues.get(b) || 0;
      return equityB - equityA; // Mayor a menor
    });

    return (
      <div className="space-y-4 pb-8">
        <h3 className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm font-semibold text-lg py-2 -mx-4 px-4 mb-2">
          <button
            type="button"
            onClick={() => setIsSectionExpanded((expanded) => !expanded)}
            aria-expanded={isSectionExpanded}
            className="flex w-full items-center gap-2 text-left hover:text-gray-700 transition-colors"
          >
            {isSectionExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            {`${matches.length} ${matches.length === 1 ? "palabra" : "palabras"} ordenadas por equity:`}
          </button>
          {isCalculatingEquities && (
            <span className="text-sm text-orange-600 font-normal">
              {" "}(calculando equity...)
            </span>
          )}
        </h3>
        {isSectionExpanded && <div className="flex flex-col gap-1">
          {sortedWords.map((word, index) => {
            const displayWord = toDisplayFormat(word);
            const length = getInternalLength(word);
            return (
              <WordWithEquity
                key={`unified-${index}`}
                word={word}
                displayWord={displayWord}
                searchTerm={searchTerm}
                title={title}
                highlightWildcardLetter={highlightWildcardLetter}
                index={index}
                length={length}
                showResidue={searchInfo.shouldShowEquityAndResidue}
              />
            );
          })}
        </div>}
      </div>
    );
  }

  // Regular grouped view by length
  const groupedByLength = matches.reduce((acc, word) => {
    const length = getInternalLength(word);
    if (!acc[length]) {
      acc[length] = [];
    }
    acc[length].push(word);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort words within each length group by equity if enabled and values are available
  if (sortByEquity && equityValues.size > 0 && !isCalculatingEquities) {
    Object.keys(groupedByLength).forEach(lengthKey => {
      groupedByLength[parseInt(lengthKey)].sort((a, b) => {
        const equityA = equityValues.get(a) || 0;
        const equityB = equityValues.get(b) || 0;
        return equityB - equityA; // Mayor a menor
      });
    });
  }

  // Sort lengths based on sortAscending prop
  const sortedLengths = Object.keys(groupedByLength)
    .map(Number)
    .sort((a, b) => sortAscending ? a - b : b - a);

  // Create highest equity section for subanagrams
  const searchInfo = parseSearchTerm(searchTerm, title);
  const isPatternResult = !!searchTerm && isPatternQuery(searchTerm);
  const isSubanagramView = searchInfo.shouldShowEquityAndResidue && matches.some(word => {
    const rackToUse = searchInfo.rack || searchTerm || '';
    return getInternalLength(word) < getInternalLength(rackToUse);
  });

  const highestEquityByLength = () => {
    if (!isSubanagramView || equityValues.size === 0) return null;

    const highestByLength: Record<number, { word: string; equity: number; residue: string }> = {};
    
    sortedLengths.forEach(length => {
      const groupWords = groupedByLength[length];
      let maxEquity = -Infinity;
      let bestWord = '';
      
      groupWords.forEach(word => {
        const equity = equityValues.get(word) || 0;
        if (equity > maxEquity) {
          maxEquity = equity;
          bestWord = word;
        }
      });
      
      if (bestWord) {
        // Calculate residue for the best word
        const displayWord = toDisplayFormat(bestWord);
        const rackToUse = searchInfo.rack || searchTerm || '';
        const residue = calculateLeave(rackToUse, displayWord.toUpperCase(), searchTerm || '');
        
        highestByLength[length] = { word: bestWord, equity: maxEquity, residue };
      }
    });

    return highestByLength;
  };

  const topEquityWords = highestEquityByLength();
  const sectionHeading = isPatternResult
    ? title
    : title.includes("adicional")
    ? `${matches.length} ${matches.length === 1 ? "palabra" : "palabras"} con letra adicional:`
    : isShortMode
    ? `${title} (${matches.length})`
    : `${matches.length} ${matches.length === 1 ? "palabra" : "palabras"} con todas las fichas:`;

  return (
    <div className="space-y-4 pb-8">
      <h3 className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm font-semibold text-lg py-2 -mx-4 px-4 mb-2">
        <button
          type="button"
          onClick={() => setIsSectionExpanded((expanded) => !expanded)}
          aria-expanded={isSectionExpanded}
          className="flex w-full items-center gap-2 text-left hover:text-gray-700 transition-colors"
        >
          {isSectionExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <span>{sectionHeading}</span>
        </button>
        {sortByEquity && isCalculatingEquities && (
          <span className="text-sm text-orange-600 font-normal">
            {" "}(ordenando por equity...)
          </span>
        )}
      </h3>
      {isSectionExpanded && (
        <>
          {/* Highest equity section */}
          {topEquityWords && Object.keys(topEquityWords).length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-lg text-green-800 mb-3">
                🏆 Mejor equity por longitud:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(topEquityWords)
                  .sort(([, a], [, b]) => b.equity - a.equity)
                  .map(([length, { word, equity, residue }]) => {
                    const displayWord = toDisplayFormat(word);
                    const lengthNum = parseInt(length);
                    return (
                      <div key={`top-${length}`} className="flex items-center gap-2 bg-white rounded-md p-2 border border-green-100">
                        <span className="text-sm font-medium text-green-700 min-w-[60px]">
                          {lengthNum} {lengthNum === 1 ? 'letra' : 'letras'}:
                        </span>
                        <a
                          href={`https://dle.rae.es/?w=${displayWord}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-green-900 hover:text-green-600 transition-colors flex-grow"
                        >
                          {highlightWildcardLetter && searchTerm
                            ? highlightWildcardLetter(displayWord, searchTerm)
                            : displayWord}
                        </a>
                        <LexiconBadge word={word} />
                        <span className="text-sm text-green-700">
                          ({residue})
                        </span>
                        <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                          {equity.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          {sortedLengths.map(length => {
        const searchInfo = parseSearchTerm(searchTerm, title);
        const isExpanded = expandedGroups.has(length);
        const groupWords = groupedByLength[length];
        const visibilityKey = `${searchTerm || ''}:${length}:${groupWords.length}`;
        const visibleWordCount = Math.min(
          groupWords.length,
          visibleWordCounts[visibilityKey] ?? LARGE_GROUP_BATCH_SIZE,
        );
        const visibleWords = groupWords.slice(0, visibleWordCount);
        const remainingWords = groupWords.length - visibleWordCount;
        
        return (
          <div key={`length-${length}`} className="space-y-2">
            <button
              onClick={() => toggleGroupExpansion(length)}
              className="flex items-center gap-2 font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupWords.length})`}
            </button>
            
            {isExpanded && (
              <div className="flex flex-col gap-1 ml-6">
                {visibleWords.map((word, index) => {
                  const displayWord = toDisplayFormat(word);
                  return (
                    <WordWithEquity
                      key={`word-${length}-${index}`}
                      word={word}
                      displayWord={displayWord}
                      searchTerm={searchTerm}
                      title={title}
                      highlightWildcardLetter={highlightWildcardLetter}
                      index={index}
                      length={length}
                      showResidue={(sortByEquity || unifiedEquityView) && searchInfo.shouldShowEquityAndResidue}
                    />
                  );
                })}
                {remainingWords > 0 && (
                  <button
                    type="button"
                    onClick={() => setVisibleWordCounts((current) => ({
                      ...current,
                      [visibilityKey]: Math.min(
                        groupWords.length,
                        visibleWordCount + LARGE_GROUP_BATCH_SIZE,
                      ),
                    }))}
                    className="mt-2 self-start rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    {`Mostrar ${Math.min(LARGE_GROUP_BATCH_SIZE, remainingWords)} más (${remainingWords} restantes)`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
          })}
        </>
      )}
    </div>
  );
};
