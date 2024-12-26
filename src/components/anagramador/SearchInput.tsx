import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SearchInputProps {
  letters: string;
  showShorter: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowShorterChange: (checked: boolean) => void;
  inputRef: RefObject<HTMLInputElement>;
}

const SearchInput = ({ 
  letters, 
  showShorter,
  onInputChange, 
  onSearch, 
  onClear, 
  onKeyPress, 
  onShowShorterChange,
  inputRef 
}: SearchInputProps) => {
  const [isPatternMode, setIsPatternMode] = useState(false);
  const [isNaturalMode, setIsNaturalMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processNaturalLanguage = async (query: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-natural-query', {
        body: { query },
      });

      if (error) throw error;
      if (data.pattern) {
        onInputChange(data.pattern);
        toast({
          title: "Consulta procesada",
          description: `Patrón generado: ${data.pattern}`,
        });
      }
    } catch (error) {
      console.error('Error processing natural language:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la consulta en lenguaje natural",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (isNaturalMode) {
      // In natural mode, we don't clean the input
      onInputChange(value);
      return;
    }
    
    // For pattern and anagram modes, clean the input
    value = value.toUpperCase();
    if (isPatternMode) {
      value = validateAndCleanPatternInput(value);
    } else {
      value = validateAndCleanAnagramInput(value);
    }
    
    onInputChange(value);
    setIsSearchMode(true);
  };

  const handleSearchClick = async () => {
    if (isSearchMode) {
      if (isNaturalMode && letters.trim()) {
        await processNaturalLanguage(letters);
      }
      onSearch();
      setIsSearchMode(false);
    } else {
      onClear();
      setIsSearchMode(true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4 mb-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="pattern-mode"
            checked={isPatternMode}
            onCheckedChange={(checked) => {
              setIsPatternMode(checked);
              setIsNaturalMode(false);
            }}
          />
          <label
            htmlFor="pattern-mode"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Modo patrón
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="natural-mode"
            checked={isNaturalMode}
            onCheckedChange={(checked) => {
              setIsNaturalMode(checked);
              setIsPatternMode(false);
            }}
          />
          <label
            htmlFor="natural-mode"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Modo natural
          </label>
        </div>
      </div>
      <SearchTooltip isPatternMode={isPatternMode}>
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={
              isNaturalMode 
                ? "Escribe tu consulta en lenguaje natural..." 
                : isPatternMode 
                  ? "Ingresa un patrón" 
                  : "asterisco es comodín"
            }
            value={letters}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchClick();
              } else {
                onKeyPress(e);
              }
            }}
            className="text-xl h-12 text-left pr-12 border border-gray-200 rounded-md"
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            disabled={isProcessing}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button 
              onClick={handleSearchClick}
              className="h-8 w-8 p-0"
              variant="ghost"
              disabled={!letters.trim() || isProcessing}
            >
              {isSearchMode ? (
                <Search className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SearchTooltip>
      <div className="flex items-center space-x-2">
        <Switch
          id="show-shorter"
          checked={showShorter}
          onCheckedChange={onShowShorterChange}
        />
        <label
          htmlFor="show-shorter"
          className="text-sm text-gray-600 cursor-pointer"
        >
          Mostrar solo palabras más cortas
        </label>
      </div>
    </div>
  );
};

export default SearchInput;