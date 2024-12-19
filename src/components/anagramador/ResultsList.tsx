import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ResultsHeader } from "./ResultsHeader";
import { PatternResults } from "./PatternResults";
import { ExactResults } from "./ExactResults";
import { ShorterResults } from "./ShorterResults";

interface ResultsListProps {
  isLoading: boolean;
  searchTerm: string;
  results: {
    exactMatches: string[];
    wildcardMatches: string[];
    additionalWildcardMatches: string[];
    patternMatches: string[];
  } | undefined;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
}

const ResultsList = ({ isLoading, searchTerm, results, highlightWildcardLetter }: ResultsListProps) => {
  const { toast } = useToast();
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const isPatternSearch = searchTerm.includes('/');

  const handleCopyAll = () => {
    if (!results) return;

    let allWords: string[] = [];

    if (isPatternSearch) {
      allWords = results.patternMatches;
    } else {
      if (wildcardCount === 0) {
        allWords = [...results.exactMatches];
      } else {
        allWords = [...results.wildcardMatches];
      }
      if (results.additionalWildcardMatches.length > 0) {
        allWords = [...allWords, ...results.additionalWildcardMatches];
      }
    }

    navigator.clipboard.writeText(allWords.join('\n')).then(() => {
      toast({
        title: "¡Copiado!",
        description: `${allWords.length} palabras copiadas al portapapeles`,
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
    <div className="md:h-[calc(100vh-12rem)] h-full overflow-auto md:overflow-hidden">
      <ScrollArea className="h-full md:h-[calc(100vh-12rem)] transition-all duration-300">
        <div className="space-y-4 pb-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader className="h-4 w-4 animate-spin" />
              Buscando anagramas...
            </div>
          ) : results && (
            results.patternMatches.length > 0 || 
            results.exactMatches.length > 0 || 
            results.wildcardMatches.length > 0 || 
            results.additionalWildcardMatches.length > 0
          ) ? (
            <>
              <ResultsHeader onCopyAll={handleCopyAll} />

              {isPatternSearch ? (
                <PatternResults matches={results.patternMatches} />
              ) : (
                <>
                  <ExactResults
                    matches={wildcardCount === 0 ? results.exactMatches : results.wildcardMatches}
                    wildcardCount={wildcardCount}
                    highlightWildcardLetter={highlightWildcardLetter}
                    searchTerm={searchTerm}
                  />
                  <ShorterResults
                    matches={results.additionalWildcardMatches}
                    highlightWildcardLetter={highlightWildcardLetter}
                    searchTerm={searchTerm}
                  />
                </>
              )}
            </>
          ) : searchTerm ? (
            <p className="text-gray-500 text-lg">No se encontraron palabras.</p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResultsList;