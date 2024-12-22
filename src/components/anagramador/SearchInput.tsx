import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";

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
      <div className="flex items-center space-x-2 mb-2">
        <Switch
          id="pattern-mode"
          checked={isPatternMode}
          onCheckedChange={setIsPatternMode}
        />
        <label
          htmlFor="pattern-mode"
          className="text-sm text-gray-600 cursor-pointer"
        >
          Modo patrón
        </label>
      </div>
      <SearchTooltip isPatternMode={isPatternMode}>
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={isPatternMode ? 
              "Ingresa un patrón" : 
              "Ingresa letras"
            }
            value={letters}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSearch();
                setIsSearchMode(false);
              } else {
                onKeyPress(e);
              }
            }}
            className="text-xl h-12 text-left pr-12"
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
          Mostrar palabras más cortas
        </label>
      </div>
    </div>
  );
};

export default SearchInput;