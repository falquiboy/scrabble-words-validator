
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import SearchResults from "./search/SearchResults";

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
  showShorter?: boolean;
}

const ResultsList = ({ 
  isLoading, 
  searchTerm, 
  results, 
  highlightWildcardLetter,
  isSearchAborted,
  showShorter
}: ResultsListProps) => {
  const { toast } = useToast();

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

    navigator.clipboard.writeText(allWords.join('\n')).then(() => {
      toast({
        title: "¡Copiado!",
        description: `${allWords.length} ${allWords.length === 1 ? 'palabra copiada' : 'palabras copiadas'}`,
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
    <ScrollArea className="h-[calc(100vh-12rem)] px-1">
      <div className="space-y-4 pb-4">
        <SearchResults
          isLoading={isLoading}
          searchTerm={searchTerm}
          results={results}
          highlightWildcardLetter={highlightWildcardLetter}
          onCopyAll={handleCopyAll}
          showShorter={showShorter}
        />
      </div>
    </ScrollArea>
  );
};

export default ResultsList;
