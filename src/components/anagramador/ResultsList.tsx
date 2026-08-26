
import { useToast } from "@/hooks/use-toast";
import SearchResults from "./search/SearchResults";
import ExtendedResultsView from "./ExtendedResultsView";
import HooksView from "./HooksView";
import ResidueResultsView from './ResidueResultsView';
import { toDisplayFormat } from "@/utils/digraphs";
import { fetchAnagramWordsData, AnagramWordInfo } from "@/utils/anagramWordData";
import { fetchHooksData, HookInfo } from "@/utils/hooksData";
import { useState, useEffect, useCallback, useRef } from "react";
import { Loader } from "lucide-react";
import type { AnagramResultView } from './viewTypes';

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
  view: AnagramResultView;
}

const ResultsList = ({ 
  isLoading, 
  searchTerm, 
  results, 
  highlightWildcardLetter,
  isSearchAborted,
  showShorter,
  view,
}: ResultsListProps) => {
  const { toast } = useToast();
  const [wordsData, setWordsData] = useState<Map<string, AnagramWordInfo>>(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hooksData, setHooksData] = useState<Map<string, HookInfo>>(new Map());
  const [isLoadingHooks, setIsLoadingHooks] = useState(false);
  const dataGenerationRef = useRef(0);
  const pendingWordsRef = useRef(new Set<string>());
  const loadedWordsRef = useRef(new Set<string>());
  const dataScope = `${searchTerm}\u0000${view}`;
  const dataScopeRef = useRef(dataScope);

  // Reset synchronously when the query/view changes so child effects cannot
  // start a request that a later parent effect immediately marks as stale.
  if (dataScopeRef.current !== dataScope) {
    dataScopeRef.current = dataScope;
    dataGenerationRef.current += 1;
    pendingWordsRef.current.clear();
    loadedWordsRef.current.clear();
    setWordsData(new Map());
    setIsLoadingData(false);
  }

  const requestWordInfo = useCallback((words: string[]) => {
    const uniqueWords = Array.from(new Set(
      words.map((word) => toDisplayFormat(word).toUpperCase()).filter(Boolean)
    ));
    const toLoad = uniqueWords.filter((word) =>
      !loadedWordsRef.current.has(word) && !pendingWordsRef.current.has(word)
    );
    if (toLoad.length === 0) return;

    const generation = dataGenerationRef.current;
    toLoad.forEach((word) => pendingWordsRef.current.add(word));
    setIsLoadingData(true);

    void fetchAnagramWordsData(toLoad)
      .then((data) => {
        if (generation !== dataGenerationRef.current) return;
        toLoad.forEach((word) => loadedWordsRef.current.add(word));
        setWordsData((previous) => {
          const next = new Map(previous);
          data.forEach((wordInfo, word) => next.set(word, wordInfo));
          return next;
        });
      })
      .catch((error) => {
        if (generation !== dataGenerationRef.current) return;
        console.error('Error loading words data:', error);
        toast({ title: 'Error cargando información adicional', variant: 'destructive' });
      })
      .finally(() => {
        if (generation !== dataGenerationRef.current) return;
        toLoad.forEach((word) => pendingWordsRef.current.delete(word));
        setIsLoadingData(pendingWordsRef.current.size > 0);
      });
  }, [toast]);

  // Clear extended data when another view becomes active.
  useEffect(() => {
    if (view !== 'extended') {
      setWordsData(new Map());
      setIsLoadingData(false);
    }
  }, [view]);

  // Load hooks data when hooks view is enabled and we have results
  useEffect(() => {
    if (view === 'hooks' && results && !isLoading) {
      // Use results as-is - they're already filtered by showShorter in the hook
      const allWordsRaw = [
        ...results.exactMatches,
        ...results.wildcardMatches,
        ...results.additionalWildcardMatches,
        ...results.shorterMatches,
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
  }, [view, results, isLoading, toast]);

  // Clear hooks data when another view becomes active.
  useEffect(() => {
    if (view !== 'hooks') {
      setHooksData(new Map());
      setIsLoadingHooks(false);
    }
  }, [view]);

  return (
    <div className="space-y-4 pb-4">
        {/* Loading spinner for initial search */}
        {isLoading && searchTerm && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader className="animate-spin text-blue-600" size={24} />
            <span className="text-gray-600 text-sm">Buscando...</span>
          </div>
        )}

        {/* Results (only show when not loading) */}
        {!isLoading && (
          <>
            {view === 'hooks' ? (
              <HooksView
                isLoading={isLoading}
                searchTerm={searchTerm}
                results={results}
                highlightWildcardLetter={highlightWildcardLetter}
                showShorter={showShorter}
                hooksData={hooksData}
                isLoadingHooks={isLoadingHooks}
              />
            ) : view === 'extended' ? (
              <ExtendedResultsView
                isLoading={isLoading}
                searchTerm={searchTerm}
                results={results}
                highlightWildcardLetter={highlightWildcardLetter}
                showShorter={showShorter}
                wordsData={wordsData}
                isLoadingData={isLoadingData}
                onRequestWords={requestWordInfo}
              />
            ) : view === 'residues' ? (
              <ResidueResultsView
                searchTerm={searchTerm}
                results={results}
                highlightWildcardLetter={highlightWildcardLetter}
              />
            ) : (
              <SearchResults
                isLoading={isLoading}
                searchTerm={searchTerm}
                results={results}
                highlightWildcardLetter={highlightWildcardLetter}
                showShorter={showShorter}
              />
            )}
          </>
        )}
    </div>
  );
};

export default ResultsList;
