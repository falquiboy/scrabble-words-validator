
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isLoading: boolean;
}

const SearchInput = ({
  query,
  onQueryChange,
  onSearch,
  isRecording,
  onStartRecording,
  onStopRecording,
  isLoading
}: SearchInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          placeholder="Escribe tu consulta en español (ej: palabras de cinco letras con dos eles)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="min-h-[100px]"
        />
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          variant="outline"
          size="icon"
          className="flex-shrink-0"
          type="button"
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>
      <Button 
        onClick={onSearch} 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Buscando...' : 'Buscar'}
      </Button>
    </div>
  );
};

export default SearchInput;
