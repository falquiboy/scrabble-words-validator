import React, { useState, useEffect } from "react";
import SearchContainer from "./anagramador/search/SearchContainer";
import ResultsList from "./anagramador/ResultsList";
import SettingsMenu from "./anagramador/SettingsMenu";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useToast } from "@/hooks/use-toast";
import { toDisplayFormat } from "@/utils/digraphs";
import { Trie } from "@/utils/trie/types";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface AnagramadorProps {
  trie: Trie;
}

const Anagramador = ({ trie }: AnagramadorProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorter, setShowShorter] = useState(false);
  const [targetLength, setTargetLength] = useState<number | null>(null);
  const [isSearchAborted, setIsSearchAborted] = useState(false);
  const [showExtendedView, setShowExtendedView] = useState(false);
  const [showHooksView, setShowHooksView] = useState(false);
  const [sortByEquity, setSortByEquity] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    exactMatches: [],
    wildcardMatches: [],
    additionalWildcardMatches: [],
    shorterMatches: [],
    patternMatches: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setShowShorter(false);
  }, []);

  useEffect(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      setSearchResults({
        exactMatches: [],
        wildcardMatches: [],
        additionalWildcardMatches: [],
        shorterMatches: [],
        patternMatches: []
      });
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const search = async () => {
      setIsLoading(true);
      setIsSearchAborted(false);
      try {
        const results = await useOfflineAnagramSearch(
          trimmedSearchTerm,
          trie,
          showShorter,
          targetLength
        );
        setSearchResults(results);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setIsSearchAborted(true);
          console.log("Search aborted:", error);
        } else {
          console.error("Error during anagram search:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    search();

    return () => {
      abortController.abort();
    };
  }, [searchTerm, showShorter, targetLength, trie]);

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
    setSearchResults({
      exactMatches: [],
      wildcardMatches: [],
      additionalWildcardMatches: [],
      shorterMatches: [],
      patternMatches: []
    });
    setIsSearchAborted(false);
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
            isSearchAborted={isSearchAborted}
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
