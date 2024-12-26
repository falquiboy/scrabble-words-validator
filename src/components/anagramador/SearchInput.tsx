import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";
import { useNaturalSearch } from "./search/NaturalSearchHandler";
import { SearchModes } from "./search/SearchModes";
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
  
  const { processQuery } = useNaturalSearch({
    onResults: (results) => {
      // Update the search term to trigger the results display
      if (results && results.length > 0) {
        onInputChange(results.join('\n'));
        onSearch();
      }
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setIsProcessing(true);
      try {
        if (isNaturalMode && letters.trim()) {
          const result = await processQuery(letters);
          if (result.success) {
            toast({
              title: "Consulta procesada",
              description: result.count > 0 
                ? `Se encontraron ${result.count} palabras` 
                : "No se encontraron palabras para esta consulta",
            });
          }
        } else {
          onSearch();
        }
        setIsSearchMode(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo procesar la consulta",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      onClear();
      setIsSearchMode(true);
    }
  };

  return (
    <div className="space-y-2">
      <SearchModes
        isPatternMode={isPatternMode}
        isNaturalMode={isNaturalMode}
        onPatternModeChange={setIsPatternMode}
        onNaturalModeChange={setIsNaturalMode}
      />
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