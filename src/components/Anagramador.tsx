import React, { useState, useEffect } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import SettingsMenu from "./anagramador/SettingsMenu";
import { useHybridAnagramSearch } from "@/hooks/useHybridAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useToast } from "@/hooks/use-toast";
import { toDisplayFormat } from "@/utils/digraphs";
import { HybridTrieService } from "@/services/HybridTrieService";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface AnagramadorProps {
  trie: HybridTrieService;
}

const Anagramador = ({ trie }: AnagramadorProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const [targetLength, setTargetLength] = useState<number | null>(null);
  const [showExtendedView, setShowExtendedView] = useState(false);
  const [showHooksView, setShowHooksView] = useState(false);
  const [sortByEquity, setSortByEquity] = useState(false);

  // Use hybrid anagram search - ALWAYS AVAILABLE! 🌍
  const { results: searchResults, isLoading, error, currentProvider } = useHybridAnagramSearch(
    searchTerm,
    trie,
    showShorter,
    targetLength
  );

  useEffect(() => {
    setShowShorter(false);
  }, []);

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
      setShowShorter(false);
    }
    
    setSearchTerm(letters);
    setTargetLength(newTargetLength);
  };

  const handleClear = () => {
    setSearchTerm("");
    setShowShorter(false);
    setTargetLength(null);
    // Note: searchResults will be cleared automatically by the hybrid hook
  };

  const handleShowShorterChange = (show: boolean) => {
    setShowShorter(show);
  };

  const handleExtendedViewChange = (show: boolean) => {
    setShowExtendedView(show);
    if (show) {
      setShowHooksView(false); // Mutually exclusive
    }
  };

  const handleHooksViewChange = (show: boolean) => {
    setShowHooksView(show);
    if (show) {
      setShowExtendedView(false); // Mutually exclusive
    }
  };

  const handleSortByEquityChange = (sort: boolean) => {
    setSortByEquity(sort);
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
      {/* Settings Menu */}
      <SettingsMenu
        showShorter={showShorter}
        onShowShorterChange={handleShowShorterChange}
        showExtendedView={showExtendedView}
        onExtendedViewChange={handleExtendedViewChange}
        showHooksView={showHooksView}
        onHooksViewChange={handleHooksViewChange}
        hasActiveSearch={!!searchTerm}
        onCopyAll={handleCopyAll}
        sortByEquity={sortByEquity}
        onSortByEquityChange={handleSortByEquityChange}
        isPatternWithoutRack={isPatternWithoutRack(searchTerm)}
      />

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
