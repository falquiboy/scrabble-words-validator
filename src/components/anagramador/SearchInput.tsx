import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState, useEffect, useRef } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";
import { SearchModes } from "./search/SearchModes";

interface SearchInputProps {
  letters: string;
  showShorter: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowShorterChange: (checked: boolean) => void;
  inputRef: RefObject<HTMLInputElement>;
  hasActiveSearch?: boolean;
  onClear?: () => void;
}

const SearchInput = ({ 
  letters, 
  showShorter,
  onInputChange, 
  onSearch,
  onKeyPress, 
  onShowShorterChange,
  inputRef,
  hasActiveSearch = false,
  onClear
}: SearchInputProps) => {
  const [isPatternMode, setIsPatternMode] = useState(false);
  const cursorPositionRef = useRef<number | null>(null);
  
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

  useEffect(() => {
    // Restore cursor position after state update
    if (cursorPositionRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current
      );
      cursorPositionRef.current = null;
    }
  }, [letters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store cursor position before state update
    cursorPositionRef.current = e.target.selectionStart;
    
    let value = e.target.value.toUpperCase();
    
    if (isPatternMode) {
      value = validateAndCleanPatternInput(value);
    } else {
      value = validateAndCleanAnagramInput(value);
    }
    
    onInputChange(value);
  };

  const handleButtonClick = () => {
    if (hasActiveSearch && onClear) {
      onClear();
    } else {
      onSearch();
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
            onKeyDown={onKeyPress}
            className="text-xl h-12 text-left pr-12 border border-gray-200 rounded-md"
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button 
              onClick={handleButtonClick}
              className="h-8 w-8 p-0 hover:text-gray-600"
              disabled={!letters.trim()}
            >
              {hasActiveSearch ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
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