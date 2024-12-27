import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState, useEffect } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";
import { SearchModes } from "./search/SearchModes";

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
  const [isSearchMode, setIsSearchMode] = useState(true);
  
  useEffect(() => {
    const handleGlobalF2 = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalF2);
    return () => window.removeEventListener('keydown', handleGlobalF2);
  }, [inputRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    if (isPatternMode) {
      value = validateAndCleanPatternInput(value);
    } else {
      value = validateAndCleanAnagramInput(value);
    }
    
    onInputChange(value);
    setIsSearchMode(true);
  };

  const handleSearchClick = () => {
    if (isSearchMode) {
      onSearch();
      setIsSearchMode(false);
    } else {
      onClear();
      setIsSearchMode(true);
    }
  };

  return (
    <div className="space-y-2">
      <SearchModes
        isPatternMode={isPatternMode}
        onPatternModeChange={setIsPatternMode}
      />
      <SearchTooltip isPatternMode={isPatternMode}>
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={
              isPatternMode 
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
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button 
              onClick={handleSearchClick}
              className="h-8 w-8 p-0"
              variant="ghost"
              disabled={!letters.trim()}
            >
              {isSearchMode ? (
                <Search className="h-4 w-4" />
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