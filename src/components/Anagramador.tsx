import React, { useCallback, useEffect, useMemo } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import { useHybridAnagramSearch } from "@/hooks/useHybridAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useToast } from "@/hooks/use-toast";
import { toDisplayFormat } from "@/utils/digraphs";
import type { WordSearchService } from '@/lexicon/types';
import { useLexicon } from '@/lexicon/LexiconContext';
import { SearchResults } from "@/hooks/anagramSearch/types";
import { isPatternQuery, parseUserQuery } from "@/utils/queryLanguage.mjs";

interface AnagramadorProps {
  trie: WordSearchService;
  // Settings props (controlled from parent)
  showShorter: boolean;
  onShowShorterChange: (show: boolean) => void;
  showExtendedView: boolean;
  onExtendedViewChange: (show: boolean) => void;
  showHooksView: boolean;
  onHooksViewChange: (show: boolean) => void;
  sortByEquity: boolean;
  onSortByEquityChange: (sort: boolean) => void;
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
  showExtendedView, 
  onExtendedViewChange,
  showHooksView, 
  onHooksViewChange,
  sortByEquity, 
  onSortByEquityChange,
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

  // Use hybrid anagram search - ALWAYS AVAILABLE! 🌍
  const { results: searchResults, isLoading, error, currentProvider } = useHybridAnagramSearch(
    searchTerm,
    trie,
    showShorter,
    targetLength
  );
  const displayResults = useMemo(() => ({
    exactMatches: sortWords(searchResults.exactMatches),
    wildcardMatches: sortWords(searchResults.wildcardMatches),
    additionalWildcardMatches: sortWords(searchResults.additionalWildcardMatches),
    shorterMatches: sortWords(searchResults.shorterMatches),
    patternMatches: sortWords(searchResults.patternMatches),
  }), [searchResults, sortWords]);

  // Notify parent about search state changes
  useEffect(() => {
    onSearchStateChange(!!searchTerm);
  }, [searchTerm, onSearchStateChange]);

  // Notify parent so the shared toggle can use the right pattern wording.
  useEffect(() => {
    onPatternSearchChange(isPatternQuery(searchTerm));
  }, [searchTerm, onPatternSearchChange]);

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
    if (letters !== searchTerm) {
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
    // Clear persistent state
    onPersistentSearchChange({
      searchTerm: "",
      targetLength: null
    });
    // Note: searchResults will be cleared automatically by the hybrid hook
  };

  // Handle mutually exclusive view changes
  const handleExtendedViewChange = (show: boolean) => {
    console.log(`🔄 Extended view changing: ${show}, hooks currently: ${showHooksView}`);
    onExtendedViewChange(show);
    if (show) {
      onHooksViewChange(false); // Mutually exclusive
      console.log(`🔄 Disabled hooks view when enabling extended`);
    }
  };

  const handleHooksViewChange = (show: boolean) => {
    console.log(`🔄 Hooks view changing: ${show}, extended currently: ${showExtendedView}`);
    onHooksViewChange(show);
    if (show) {
      onExtendedViewChange(false); // Mutually exclusive
      console.log(`🔄 Disabled extended view when enabling hooks`);
    }
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
      // Include exact/wildcard matches
      if (wildcardCount === 0) {
        allWords = [...(displayResults.exactMatches || [])];
      } else {
        allWords = [...(displayResults.wildcardMatches || [])];
      }
      
      // Include additional letter matches
      const filteredAdditionalMatches = displayResults.additionalWildcardMatches.filter(word => {
        if (wildcardCount === 0) {
          return !displayResults.exactMatches.includes(word);
        } else {
          return !displayResults.wildcardMatches.includes(word);
        }
      });
      
      if (filteredAdditionalMatches.length > 0) {
        allWords = [...allWords, ...filteredAdditionalMatches];
      }
      
      // Include shorter matches if any
      if (displayResults.shorterMatches?.length > 0) {
        allWords = [...allWords, ...(displayResults.shorterMatches || [])];
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
  }, [displayResults, searchTerm, toast]);

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
            />
          </div>
        </div>
      </div>
      
      {/* Scrollable Results Only */}
      <div className="pt-20 h-full overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-4 pb-4">
          <div className="w-full max-w-md mx-auto">
            <ResultsList
              isLoading={isLoading}
              searchTerm={searchTerm}
              results={displayResults}
              highlightWildcardLetter={highlightWildcardLetter}
              isSearchAborted={false}
              showShorter={showShorter}
              showExtendedView={showExtendedView}
              showHooksView={showHooksView}
              sortByEquity={sortByEquity}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Anagramador;
