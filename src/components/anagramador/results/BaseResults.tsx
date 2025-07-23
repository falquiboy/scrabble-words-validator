
import React, { useState, useEffect } from 'react';
import { processDigraphs, getInternalLength, toDisplayFormat } from "@/utils/digraphs";
import { calculateWordScore } from "@/utils/scrabbleScore";
import { calculatePotentialValue } from "@/utils/leavesData";

interface BaseResultsProps {
  matches: string[];
  title: string;
  highlightWildcardLetter?: (word: string, originalWord: string) => React.ReactNode;
  searchTerm?: string;
  isShortMode?: boolean;
  sortAscending?: boolean;
  sortByEquity?: boolean; // Nueva prop para ordenar por equity
}

// Componente para mostrar una palabra con su equity
const WordWithEquity: React.FC<{
  word: string;
  displayWord: string;
  searchTerm?: string;
  highlightWildcardLetter?: (word: string, originalWord: string) => React.ReactNode;
  index: number;
  length: number;
}> = ({ word, displayWord, searchTerm, highlightWildcardLetter, index, length }) => {
  const [equity, setEquity] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const baseScore = calculateWordScore(displayWord);
  const isSubanagram = searchTerm && displayWord.length < searchTerm.length;

  useEffect(() => {
    const calculateEquity = async () => {
      if (!isSubanagram) {
        setEquity(baseScore);
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
      } catch (error) {
        console.error('Error calculating equity:', error);
        setEquity(baseScore); // Fallback to base score
      } finally {
        setIsCalculating(false);
      }
    };

    calculateEquity();
  }, [baseScore, searchTerm, displayWord, isSubanagram]);

  return (
    <a
      key={`word-${length}-${index}`}
      href={`https://dle.rae.es/?w=${displayWord}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:bg-gray-100 p-1.5 rounded transition-colors text-lg"
    >
      <span className="flex items-center gap-2">
        {highlightWildcardLetter && searchTerm 
          ? highlightWildcardLetter(displayWord, searchTerm)
          : displayWord}
        <span className={`text-sm ${isSubanagram && equity !== baseScore ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
          ({isCalculating ? '...' : equity || baseScore})
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
  sortByEquity = false
}: BaseResultsProps) => {
  const [equityValues, setEquityValues] = useState<Map<string, number>>(new Map());
  const [isCalculatingEquities, setIsCalculatingEquities] = useState(false);

  if (matches.length === 0) return null;

  // Pre-calculate equity values for sorting when sortByEquity is true
  useEffect(() => {
    if (!sortByEquity || !searchTerm) return;

    const calculateAllEquities = async () => {
      setIsCalculatingEquities(true);
      const newEquityValues = new Map<string, number>();

      for (const word of matches) {
        const displayWord = toDisplayFormat(word);
        const baseScore = calculateWordScore(displayWord);
        const isSubanagram = displayWord.length < searchTerm.length;

        if (isSubanagram) {
          try {
            const equity = await calculatePotentialValue(
              baseScore, 
              searchTerm, 
              displayWord.toUpperCase()
            );
            newEquityValues.set(word, equity);
          } catch (error) {
            console.error('Error calculating equity for', word, error);
            newEquityValues.set(word, baseScore);
          }
        } else {
          newEquityValues.set(word, baseScore);
        }
      }

      setEquityValues(newEquityValues);
      setIsCalculatingEquities(false);
    };

    calculateAllEquities();
  }, [matches, searchTerm, sortByEquity]);

  // Group words by internal length
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
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
