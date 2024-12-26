import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchResults } from "@/hooks/anagramSearch/types";

interface ResultsHeaderProps {
  results: SearchResults;
}

export const ResultsHeader = ({ results }: ResultsHeaderProps) => {
  const handleCopyAll = () => {
    const allWords = [
      ...results.exactMatches,
      ...results.wildcardMatches,
      ...results.additionalWildcardMatches,
      ...results.patternMatches
    ];

    if (allWords.length === 0) return;

    navigator.clipboard.writeText(allWords.join('\n'))
      .then(() => {
        toast({
          title: "¡Copiado!",
          description: `${allWords.length} palabras copiadas al portapapeles`,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "No se pudieron copiar las palabras",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleCopyAll}
      >
        <Copy className="h-4 w-4" />
        Copiar todo
      </Button>
    </div>
  );
};