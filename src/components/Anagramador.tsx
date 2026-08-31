import React, { useCallback, useEffect, useMemo } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import { useHybridAnagramSearch } from "@/hooks/useHybridAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useToast } from "@/hooks/use-toast";
import { getInternalLength, toDisplayFormat } from "@/utils/digraphs";
import type { WordSearchService } from '@/lexicon/types';
import { useLexicon } from '@/lexicon/LexiconContext';
import { isPatternQuery, parseUserQuery } from "@/utils/queryLanguage.mjs";
import { sortWordsByFirstWildcardTile } from '@/utils/wildcardSubanagrams';
import { sortWordsByAddedLetter } from '@/utils/additionalLetterSort';
import { canOrderShorterWordsByEquity } from '@/utils/equitySearch';
import type { AnagramResultView } from './anagramador/viewTypes';

interface AnagramadorProps {
  trie: WordSearchService;
  // Settings props (controlled from parent)
  showShorter: boolean;
  onShowShorterChange: (show: boolean) => void;
  sortShorterByEquity: boolean;
  onSortShorterByEquityChange: (sort: boolean) => void;
  view: AnagramResultView;
  onViewChange: (view: AnagramResultView) => void;
  // Callback props to communicate state changes to parent
  onSearchStateChange: (hasActiveSearch: boolean) => void;
  onCopyAllCallbackChange: (callback: (() => void) | undefined) => void;
  onPatternSearchChange: (isPatternSearch: boolean) => void;
  // Persistent search state (survives tab navigation)
  persistentSearchTerm: string;
  persistentTargetLength: number | null;
  onPersistentSearchChange: (state: { searchTerm: string; targetLength: number | null }) => void;
}

const Anagramador = ({ 
  trie, 
  showShorter, 
  onShowShorterChange,
  sortShorterByEquity,
  onSortShorterByEquityChange,
  view,
  onViewChange,
  onSearchStateChange,
  onCopyAllCallbackChange,
  onPatternSearchChange,
  persistentSearchTerm,
  persistentTargetLength,
  onPersistentSearchChange
}: AnagramadorProps) => {
  const { toast } = useToast();
  const { sortWords } = useLexicon();
  
  // Use persistent state from parent instead of local state
  const searchTerm = persistentSearchTerm;
  const targetLength = persistentTargetLength;
  const showsEquityToggle = showShorter && canOrderShorterWordsByEquity(searchTerm);

  // Use hybrid anagram search - ALWAYS AVAILABLE! 🌍
  const { results: searchResults, isLoading, error, currentProvider } = useHybridAnagramSearch(
    searchTerm,
    trie,
    showShorter,
    targetLength
  );
  const displayResults = useMemo(() => {
    const query = parseUserQuery(searchTerm);
    const wildcardMatches = query.kind === 'anagram' && query.wildcardCount > 0
      ? sortWordsByFirstWildcardTile(searchResults.wildcardMatches, query.letters)
      : sortWords(searchResults.wildcardMatches);
    const additionalWildcardMatches = query.kind === 'anagram'
      ? query.wildcardCount > 0
        ? sortWordsByFirstWildcardTile(searchResults.additionalWildcardMatches, query.letters)
        : sortWordsByAddedLetter(query.letters, searchResults.additionalWildcardMatches)
      : sortWords(searchResults.additionalWildcardMatches);

    return {
      exactMatches: sortWords(searchResults.exactMatches),
      wildcardMatches,
      additionalWildcardMatches,
      shorterMatches: sortWords(searchResults.shorterMatches),
      patternMatches: sortWords(searchResults.patternMatches),
    };
  }, [searchResults, searchTerm, sortWords]);

  // Notify parent about search state changes
  useEffect(() => {
    onSearchStateChange(!!searchTerm);
  }, [searchTerm, onSearchStateChange]);

  // Notify parent so the shared toggle can use the right pattern wording.
  useEffect(() => {
    const patternSearch = isPatternQuery(searchTerm);
    onPatternSearchChange(patternSearch);
    if (sortShorterByEquity && (!showShorter || !canOrderShorterWordsByEquity(searchTerm))) {
      onSortShorterByEquityChange(false);
    }
  }, [searchTerm, onPatternSearchChange, onSortShorterByEquityChange, showShorter, sortShorterByEquity]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error en la búsqueda",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleSearch = (letters: string, newTargetLength: number | null) => {
    if (letters !== searchTerm) onSortShorterByEquityChange(false);

    const query = parseUserQuery(letters);
    const requestsShorterLength = query.kind === 'anagram'
      && newTargetLength !== null
      && newTargetLength < getInternalLength(query.letters);

    if (requestsShorterLength) {
      // A pool followed by a shorter target (for example, unseen tiles + :7)
      // explicitly asks for subanagrams, so no settings detour is necessary.
      onShowShorterChange(true);
    } else if (letters !== searchTerm) {
      onShowShorterChange(false);
    }
    
    // Update persistent state instead of local state
    onPersistentSearchChange({
      searchTerm: letters,
      targetLength: newTargetLength
    });
  };

  const handleClear = () => {
    onShowShorterChange(false);
    onSortShorterByEquityChange(false);
    onViewChange('anagrams');
    // Clear persistent state
    onPersistentSearchChange({
      searchTerm: "",
      targetLength: null
    });
    // Note: searchResults will be cleared automatically by the hybrid hook
  };

  const handleCopyAll = useCallback(() => {
    if (!displayResults) return;

    const query = parseUserQuery(searchTerm);
    const isPatternSearch = query.kind === 'pattern';
    const wildcardCount = query.wildcardCount;

    let allWords: string[] = [];

    if (isPatternSearch) {
      allWords = [...(displayResults.patternMatches || [])];
    } else {
      if (showShorter) {
        allWords = [
          ...(displayResults.wildcardMatches || []),
          ...(displayResults.shorterMatches || []),
        ];
      } else {
        allWords = wildcardCount === 0
          ? [...(displayResults.exactMatches || [])]
          : [...(displayResults.wildcardMatches || [])];

        const currentWords = new Set(allWords);
        allWords.push(...displayResults.additionalWildcardMatches.filter((word) => !currentWords.has(word)));
      }
    }

    // Convertir cada palabra a su formato de visualización antes de copiar
    const formattedWords = allWords.map(word => toDisplayFormat(word));

    navigator.clipboard.writeText(formattedWords.join('\n')).then(() => {
      toast({
        title: "¡Copiado!",
        description: `${formattedWords.length} ${formattedWords.length === 1 ? 'palabra copiada' : 'palabras copiadas'}`,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudieron copiar las palabras",
        variant: "destructive",
      });
    });
  }, [displayResults, searchTerm, showShorter, toast]);

  // Provide copy callback to parent
  useEffect(() => {
    if (searchTerm) {
      onCopyAllCallbackChange(() => handleCopyAll);
    } else {
      onCopyAllCallbackChange(undefined);
    }
  }, [handleCopyAll, onCopyAllCallbackChange, searchTerm]);

  return (
    <div className="relative h-full">
      {/* Absolutely Fixed Search Container */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gray-50/95 backdrop-blur-sm">
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
          <div className="w-full max-w-md mx-auto">
            <SearchContainer
              onSearch={handleSearch}
              onClear={handleClear}
              showShorter={showShorter}
              onShowShorterChange={onShowShorterChange}
              sortByEquity={sortShorterByEquity}
              onSortByEquityChange={onSortShorterByEquityChange}
            />
          </div>
        </div>
      </div>
      
      {/* Scrollable Results Only */}
      <div className={`${showsEquityToggle ? 'pt-32' : 'pt-24'} h-full overflow-y-auto`}>
        <div className="w-full max-w-2xl mx-auto px-4 pb-4">
          <div className="w-full max-w-md mx-auto">
            <ResultsList
              isLoading={isLoading}
              searchTerm={searchTerm}
              results={displayResults}
              highlightWildcardLetter={highlightWildcardLetter}
              isSearchAborted={false}
              showShorter={showShorter}
              sortByEquity={sortShorterByEquity}
              view={view}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Anagramador;
