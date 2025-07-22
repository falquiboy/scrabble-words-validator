
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import SearchResults from "./search/SearchResults";
import ExtendedWordView from "./ExtendedWordView";
import ExtendedResultsView from "./ExtendedResultsView";
import { toDisplayFormat } from "@/utils/digraphs";
import { fetchAnagramWordsData, AnagramWordInfo } from "@/utils/anagramWordData";
import { debugAnagramData } from "@/utils/debugAnagramData";
import { useState, useEffect } from "react";
import { Info } from "lucide-react";

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
  onExtendedViewChange?: (show: boolean) => void;
}

const ResultsList = ({ 
  isLoading, 
  searchTerm, 
  results, 
  highlightWildcardLetter,
  isSearchAborted,
  showShorter,
  showExtendedView,
  onExtendedViewChange
}: ResultsListProps) => {
  const { toast } = useToast();
  const [wordsData, setWordsData] = useState<Map<string, AnagramWordInfo>>(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load word data when extended view is enabled and we have results
  useEffect(() => {
    if (showExtendedView && results && !isLoading) {
      const allWords = [
        ...results.exactMatches,
        ...results.wildcardMatches,
        ...results.additionalWildcardMatches,
        ...(showShorter ? results.shorterMatches : []),
        ...results.patternMatches
      ].map(word => toDisplayFormat(word));

      if (allWords.length > 0) {
        setIsLoadingData(true);
        fetchAnagramWordsData(allWords)
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
        {/* Extended View Toggle */}
        {hasResults && onExtendedViewChange && (
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
            {/* Debug button (temporary) */}
            <button
              onClick={() => debugAnagramData()}
              className="text-xs text-red-600 hover:text-red-800"
            >
              🐛 Debug
            </button>
            
            <div className="flex items-center space-x-2">
              <Info size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Vista extendida:</span>
              <button
                onClick={() => onExtendedViewChange(!showExtendedView)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                  showExtendedView ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    showExtendedView ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {showExtendedView ? (
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
