
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import SearchResults from "./search/SearchResults";
import ExtendedWordView from "./ExtendedWordView";
import ExtendedResultsView from "./ExtendedResultsView";
import HooksView from "./HooksView";
import { toDisplayFormat } from "@/utils/digraphs";
import { fetchAnagramWordsData, AnagramWordInfo } from "@/utils/anagramWordData";
import { fetchHooksData, HookInfo } from "@/utils/hooksData";
import { useState, useEffect } from "react";
import { Info, Anchor } from "lucide-react";

interface ResultsListProps {
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
  isSearchAborted?: boolean;
  showShorter: boolean;
  showExtendedView?: boolean;
  showHooksView?: boolean;
}

const ResultsList = ({ 
  isLoading, 
  searchTerm, 
  results, 
  highlightWildcardLetter,
  isSearchAborted,
  showShorter,
  showExtendedView,
  showHooksView
}: ResultsListProps) => {
  const { toast } = useToast();
  const [wordsData, setWordsData] = useState<Map<string, AnagramWordInfo>>(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hooksData, setHooksData] = useState<Map<string, HookInfo>>(new Map());
  const [isLoadingHooks, setIsLoadingHooks] = useState(false);

  // Load word data when extended view is enabled and we have results
  useEffect(() => {
    if (showExtendedView && results && !isLoading) {
      const allWordsRaw = [
        ...results.exactMatches,
        ...results.wildcardMatches,
        ...results.additionalWildcardMatches,
        ...(showShorter ? results.shorterMatches : []),
        ...results.patternMatches
      ];
      
      const allWordsForQuery = allWordsRaw.map(word => toDisplayFormat(word).toUpperCase());

      if (allWordsForQuery.length > 0) {
        setIsLoadingData(true);
        fetchAnagramWordsData(allWordsForQuery)
          .then(data => {
            setWordsData(data);
          })
          .catch(error => {
            console.error('Error loading words data:', error);
            toast({ title: 'Error cargando información adicional', variant: 'destructive' });
          })
          .finally(() => {
            setIsLoadingData(false);
          });
      }
    }
  }, [showExtendedView, results, showShorter, isLoading]);

  // Load hooks data when hooks view is enabled and we have results
  useEffect(() => {
    if (showHooksView && results && !isLoading) {
      const allWordsRaw = [
        ...results.exactMatches,
        ...results.wildcardMatches,
        ...results.additionalWildcardMatches,
        ...(showShorter ? results.shorterMatches : []),
        ...results.patternMatches
      ];
      
      const allWordsForQuery = allWordsRaw.map(word => toDisplayFormat(word).toUpperCase());

      if (allWordsForQuery.length > 0) {
        setIsLoadingHooks(true);
        fetchHooksData(allWordsForQuery)
          .then(data => {
            setHooksData(data);
          })
          .catch(error => {
            console.error('Error loading hooks data:', error);
            toast({ title: 'Error cargando información de ganchos', variant: 'destructive' });
          })
          .finally(() => {
            setIsLoadingHooks(false);
          });
      }
    }
  }, [showHooksView, results, showShorter, isLoading]);

  const handleCopyAll = () => {
    if (!results) return;

    const isPatternSearch = searchTerm.includes('?') || searchTerm.includes('-');
    const wildcardCount = (searchTerm.match(/\*/g) || []).length;

    let allWords: string[] = [];

    if (isPatternSearch) {
      allWords = [...(results.patternMatches || [])];
    } else {
      // Include exact/wildcard matches
      if (wildcardCount === 0) {
        allWords = [...(results.exactMatches || [])];
      } else {
        allWords = [...(results.wildcardMatches || [])];
      }
      
      // Include additional letter matches
      const filteredAdditionalMatches = results.additionalWildcardMatches.filter(word => {
        if (wildcardCount === 0) {
          return !results.exactMatches.includes(word);
        } else {
          return !results.wildcardMatches.includes(word);
        }
      });
      
      if (filteredAdditionalMatches.length > 0) {
        allWords = [...allWords, ...filteredAdditionalMatches];
      }
      
      // Include shorter matches if any
      if (results.shorterMatches?.length > 0) {
        allWords = [...allWords, ...(results.shorterMatches || [])];
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

  // Check if we have any results to show the toggle
  const hasResults = results && (
    results.exactMatches.length > 0 ||
    results.wildcardMatches.length > 0 ||
    results.additionalWildcardMatches.length > 0 ||
    results.shorterMatches.length > 0 ||
    results.patternMatches.length > 0
  );

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] px-1">
      <div className="space-y-4 pb-4">

        {showHooksView ? (
          <HooksView
            isLoading={isLoading}
            searchTerm={searchTerm}
            results={results}
            highlightWildcardLetter={highlightWildcardLetter}
            onCopyAll={handleCopyAll}
            showShorter={showShorter}
            hooksData={hooksData}
            isLoadingHooks={isLoadingHooks}
          />
        ) : showExtendedView ? (
          <ExtendedResultsView
            isLoading={isLoading}
            searchTerm={searchTerm}
            results={results}
            highlightWildcardLetter={highlightWildcardLetter}
            onCopyAll={handleCopyAll}
            showShorter={showShorter}
            wordsData={wordsData}
            isLoadingData={isLoadingData}
          />
        ) : (
          <SearchResults
            isLoading={isLoading}
            searchTerm={searchTerm}
            results={results}
            highlightWildcardLetter={highlightWildcardLetter}
            onCopyAll={handleCopyAll}
            showShorter={showShorter}
          />
        )}
      </div>
    </ScrollArea>
  );
};

export default ResultsList;
