import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BaseResultsProps {
  matches: string[];
  title?: string;
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
  searchTerm: string;
}

const BaseResults = ({ matches, title, highlightWildcardLetter, searchTerm }: BaseResultsProps) => {
  const { toast } = useToast();

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word).then(() => {
      toast({
        title: "¡Copiado!",
        description: word,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar la palabra",
        variant: "destructive",
      });
    });
  };

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="py-3">
          <p className="text-sm text-muted-foreground">{title}</p>
        </CardHeader>
      )}
      <CardContent className="grid grid-cols-1 gap-2 py-3">
        {matches.map((word, index) => (
          <div key={`${word}-${index}`} className="flex items-center justify-between">
            <div className="text-lg font-medium">
              {highlightWildcardLetter(word, searchTerm)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(word)}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BaseResults;