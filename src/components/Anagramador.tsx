import React, { useState, useEffect } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import { useHybridAnagramSearch } from "@/hooks/useHybridAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useToast } from "@/hooks/use-toast";
import { toDisplayFormat } from "@/utils/digraphs";
import { HybridTrieService } from "@/services/HybridTrieService";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface AnagramadorProps {
  trie: HybridTrieService;
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
  onPatternWithoutRackChange: (isPatternWithoutRack: boolean) => void;
  // Persistent search state (survives tab navigation)
  persistentSearchTerm: string;
  persistentTargetLength: number | null;
  onPersistentSearchChange: (state: { searchTerm: string; targetLength: number | null }) => void;
  // Persistent results cache (avoids re-searching on tab switches)
  persistentResults: SearchResults;
  onPersistentResultsChange: (results: SearchResults) => void;
}

// Helper functions for cached results
const getLastSearchKey = (results: any): string => {
  return results._searchKey || "";
};

const getLastTargetLength = (results: any): number | null => {
  return results._targetLength || null;
};

const hasValidCachedResults = (results: SearchResults): boolean => {
  return !!(results.exactMatches.length > 0 || 
           results.wildcardMatches.length > 0 || 
           results.additionalWildcardMatches.length > 0 || 
           results.shorterMatches.length > 0 || 
           results.patternMatches.length > 0 ||
           (results as any)._searchKey); // Even empty results are valid if they have metadata
};

const hasValidResults = (results: SearchResults): boolean => {
  return !!(results.exactMatches.length > 0 || 
           results.wildcardMatches.length > 0 || 
           results.additionalWildcardMatches.length > 0 || 
           results.shorterMatches.length > 0 || 
           results.patternMatches.length > 0);
};

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
  onPatternWithoutRackChange,
  persistentSearchTerm,
  persistentTargetLength,
  onPersistentSearchChange,
  persistentResults,
  onPersistentResultsChange
}: AnagramadorProps) => {
  const { toast } = useToast();
  
  // Use persistent state from parent instead of local state
  const searchTerm = persistentSearchTerm;
  const targetLength = persistentTargetLength;

  // Check if we can use cached results (same search term and target length)
  const canUseCachedResults = searchTerm === getLastSearchKey(persistentResults) && 
                              targetLength === getLastTargetLength(persistentResults);
  
  // Use hybrid anagram search - ALWAYS AVAILABLE! 🌍
  const { results: freshResults, isLoading, error, currentProvider } = useHybridAnagramSearch(
    canUseCachedResults ? "" : searchTerm, // Skip search if we have cached results
    trie,
    showShorter,
    targetLength
  );
  
  // Use cached results if available, otherwise use fresh results
  const searchResults = canUseCachedResults && hasValidCachedResults(persistentResults) ? 
                       persistentResults : freshResults;

  // Update persistent results when fresh results are available
  useEffect(() => {
    if (!canUseCachedResults && searchTerm && hasValidResults(freshResults)) {
      const resultsWithMetadata = {
        ...freshResults,
        _searchKey: searchTerm,
        _targetLength: targetLength,
        _timestamp: Date.now()
      } as SearchResults & { _searchKey: string; _targetLength: number | null; _timestamp: number };
      onPersistentResultsChange(resultsWithMetadata);
    }
  }, [freshResults, searchTerm, targetLength, canUseCachedResults, onPersistentResultsChange]);
  
  // Notify parent about search state changes
  useEffect(() => {
    onSearchStateChange(!!searchTerm);
  }, [searchTerm, onSearchStateChange]);

  // Notify parent about pattern without rack state
  useEffect(() => {
    onPatternWithoutRackChange(isPatternWithoutRack(searchTerm));
  }, [searchTerm, onPatternWithoutRackChange]);

  // Provide copy callback to parent
  useEffect(() => {
    if (searchTerm) {
      onCopyAllCallbackChange(() => handleCopyAll);
    } else {
      onCopyAllCallbackChange(undefined);
    }
  }, [searchTerm, searchResults, onCopyAllCallbackChange]);

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
    // Clear cached results
    onPersistentResultsChange({
      exactMatches: [],
      wildcardMatches: [],
      additionalWildcardMatches: [],
      shorterMatches: [],
      patternMatches: []
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

  // Utilidad para detectar patrones sin rack
  const isPatternWithoutRack = (term: string) => {
    const isPatternSearch = term.includes('*') || 
                           term.includes('.') || 
                           term.includes('-') || 
                           term.includes('^') || 
                           term.includes('$') || 
                           term.includes(':');
    const hasRackRestriction = isPatternSearch && term.includes(',');
    return isPatternSearch && !hasRackRestriction;
  };

  const handleCopyAll = () => {
    if (!searchResults) return;

    const isPatternSearch = searchTerm.includes('*') || searchTerm.includes('.') || searchTerm.includes('-');
    const wildcardCount = (searchTerm.match(/\?/g) || []).length;

    let allWords: string[] = [];

    if (isPatternSearch) {
      allWords = [...(searchResults.patternMatches || [])];
    } else {
      // Include exact/wildcard matches
      if (wildcardCount === 0) {
        allWords = [...(searchResults.exactMatches || [])];
      } else {
        allWords = [...(searchResults.wildcardMatches || [])];
      }
      
      // Include additional letter matches
      const filteredAdditionalMatches = searchResults.additionalWildcardMatches.filter(word => {
        if (wildcardCount === 0) {
          return !searchResults.exactMatches.includes(word);
        } else {
          return !searchResults.wildcardMatches.includes(word);
        }
      });
      
      if (filteredAdditionalMatches.length > 0) {
        allWords = [...allWords, ...filteredAdditionalMatches];
      }
      
      // Include shorter matches if any
      if (searchResults.shorterMatches?.length > 0) {
        allWords = [...allWords, ...(searchResults.shorterMatches || [])];
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
  };

  return (
    <>
      {/* Main Interface */}
      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-md space-y-4">
          <SearchContainer
            onSearch={handleSearch}
            onClear={handleClear}
          />
          
          <ResultsList
            isLoading={isLoading}
            searchTerm={searchTerm}
            results={searchResults}
            highlightWildcardLetter={highlightWildcardLetter}
            isSearchAborted={false}
            showShorter={showShorter}
            showExtendedView={showExtendedView}
            showHooksView={showHooksView}
            sortByEquity={sortByEquity}
          />
        </div>
      </div>
    </>
  );
};

export default Anagramador;
