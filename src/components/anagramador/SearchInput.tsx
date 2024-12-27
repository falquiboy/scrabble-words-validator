import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, History } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState, useEffect, useRef } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";
import { SearchModes } from "./search/SearchModes";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const cursorPositionRef = useRef<number | null>(null);
  const { history, addToHistory, clearHistory, navigateHistory } = useSearchHistory('anagram');
  
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
    setIsSearchMode(true);
  };

  const handleSearchClick = () => {
    if (isSearchMode) {
      onSearch();
      addToHistory(letters);
      setIsSearchMode(false);
    } else {
      onClear();
      setIsSearchMode(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = navigateHistory(e.key === 'ArrowUp' ? 'up' : 'down', letters);
      onInputChange(newValue);
    } else if (e.key === 'Enter') {
      handleSearchClick();
    } else {
      onKeyPress(e);
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
            onKeyDown={handleKeyDown}
            className="text-xl h-12 text-left pr-24 border border-gray-200 rounded-md"
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <History className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[40vh]">
                <SheetHeader>
                  <SheetTitle>Historial de búsquedas</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  {history.length > 0 ? (
                    <div className="space-y-2">
                      {history.map((item, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => {
                            onInputChange(item);
                            document.querySelector('[data-radix-collection-item]')?.click();
                          }}
                        >
                          {item}
                        </button>
                      ))}
                      <Button
                        variant="ghost"
                        className="w-full mt-4"
                        onClick={clearHistory}
                      >
                        Limpiar historial
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No hay búsquedas recientes</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
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