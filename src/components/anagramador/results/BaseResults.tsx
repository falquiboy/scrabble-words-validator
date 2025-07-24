
import React, { useState, useEffect } from 'react';
import { processDigraphs, getInternalLength, toDisplayFormat } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";
import { calculatePotentialValue, calculateLeave, getBatchLeaveValues } from "@/utils/leavesData";

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
  highlightWildcardLetter?: (word: string, originalWord: string) => React.ReactNode;
  index: number;
  length: number;
  showResidue?: boolean; // Nueva prop para mostrar residuo en lugar de equity
}> = ({ word, displayWord, searchTerm, highlightWildcardLetter, index, length, showResidue = false }) => {
  const [equity, setEquity] = useState<number | null>(null);
  const [residue, setResidue] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  
  const baseScore = calculateWordScore(displayWord);
  const isSubanagram = searchTerm && displayWord.length < searchTerm.length;

  useEffect(() => {
    const calculateEquity = async () => {
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
          searchTerm, 
          displayWord.toUpperCase()
        );
        setEquity(potentialValue);

        // Calculate residue if needed
        if (showResidue) {
          const leave = calculateLeave(searchTerm, displayWord.toUpperCase());
          setResidue(leave);
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
  }, [baseScore, searchTerm, displayWord, isSubanagram, showResidue]);

  return (
    <a
      key={`word-${length}-${index}`}
      href={`https://dle.rae.es/?w=${displayWord}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:bg-gray-100 p-1.5 rounded transition-colors text-lg ${showResidue ? 'block w-full' : ''}`}
    >
      <span className="flex items-center gap-2">
        {showResidue && (
          <span className={`text-sm ${isSubanagram && equity !== baseScore ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
            {isCalculating ? '...' : equity || baseScore}
          </span>
        )}
        {highlightWildcardLetter && searchTerm 
          ? highlightWildcardLetter(displayWord, searchTerm)
          : displayWord}
        <span className={`text-sm ${isSubanagram && equity !== baseScore ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
          ({isCalculating ? '...' : showResidue && residue ? residue : equity || baseScore})
        </span>
      </span>
    </a>
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

  if (matches.length === 0) return null;

  // Pre-calculate equity values for sorting when sortByEquity or unifiedEquityView is true
  useEffect(() => {
    if ((!sortByEquity && !unifiedEquityView) || !searchTerm) return;

    const calculateAllEquities = async () => {
      setIsCalculatingEquities(true);
      const newEquityValues = new Map<string, number>();

      // Separar subanagramas y palabras normales
      const subanagrams: string[] = [];
      const normalWords: string[] = [];
      
      for (const word of matches) {
        const displayWord = toDisplayFormat(word);
        const isSubanagram = displayWord.length < searchTerm.length;
        
        if (isSubanagram) {
          subanagrams.push(word);
        } else {
          normalWords.push(word);
        }
      }

      // Procesar palabras normales (solo base score)
      for (const word of normalWords) {
        const displayWord = toDisplayFormat(word);
        const baseScore = calculateWordScore(displayWord);
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
          const leave = calculateLeave(searchTerm, displayWord.toUpperCase());
          leavesToQuery.push(leave);
          wordToLeaveMap.set(word, leave);
        }

        try {
          // Single batch query para todos los leaves
          const leaveValues = await getBatchLeaveValues(leavesToQuery);
          
          // Calcular equity para cada subanagrama
          for (const word of subanagrams) {
            const displayWord = toDisplayFormat(word);
            const baseScore = calculateWordScore(displayWord);
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
            const baseScore = calculateWordScore(displayWord);
            newEquityValues.set(word, baseScore);
          }
        }
      }

      setEquityValues(newEquityValues);
      setIsCalculatingEquities(false);
    };

    calculateAllEquities();
  }, [matches, searchTerm, sortByEquity, unifiedEquityView]);

  // Handle unified equity view - all words sorted by absolute equity
  if (unifiedEquityView && equityValues.size > 0) {
    const sortedWords = [...matches].sort((a, b) => {
      const equityA = equityValues.get(a) || 0;
      const equityB = equityValues.get(b) || 0;
      return equityB - equityA; // Mayor a menor
    });

    return (
      <div className="space-y-4 pb-8">
        <h3 className="font-semibold text-lg">
          {`${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} ordenadas por equity:`}
          {isCalculatingEquities && (
            <span className="text-sm text-orange-600 font-normal">
              {" "}(calculando equity...)
            </span>
          )}
        </h3>
        <div className="flex flex-col gap-1">
          {sortedWords.map((word, index) => {
            const displayWord = toDisplayFormat(word);
            const length = getInternalLength(word);
            return (
              <WordWithEquity
                key={`unified-${index}`}
                word={word}
                displayWord={displayWord}
                searchTerm={searchTerm}
                highlightWildcardLetter={highlightWildcardLetter}
                index={index}
                length={length}
                showResidue={true} // Show residue instead of equity in unified view
              />
            );
          })}
        </div>
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

  // Sort words within each length group by equity if enabled
  if (sortByEquity && equityValues.size > 0) {
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

  return (
    <div className="space-y-4 pb-8">
      <h3 className="font-semibold text-lg">
        {title.includes("adicional") 
          ? `${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"} usando todas las fichas más una letra adicional:` 
          : `${matches.length} ${matches.length === 1 ? "palabra encontrada" : "palabras encontradas"}${isShortMode ? "" : " usando todas las fichas"}:`
        }
        {sortByEquity && isCalculatingEquities && (
          <span className="text-sm text-orange-600 font-normal">
            {" "}(ordenando por equity...)
          </span>
        )}
      </h3>
      {sortedLengths.map(length => (
        <div key={`length-${length}`} className="space-y-2">
          <h4 className="font-medium text-gray-600">
            {`Palabras de ${length} ${length === 1 ? 'letra' : 'letras'} (${groupedByLength[length].length}):`}
          </h4>
          <div className="flex flex-wrap gap-2">
            {groupedByLength[length].map((word, index) => {
              const displayWord = toDisplayFormat(word);
              return (
                <WordWithEquity
                  key={`word-${length}-${index}`}
                  word={word}
                  displayWord={displayWord}
                  searchTerm={searchTerm}
                  highlightWildcardLetter={highlightWildcardLetter}
                  index={index}
                  length={length}
                  showResidue={true} // Always show unified format in grouped view too
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
