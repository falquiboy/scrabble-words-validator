import { Input } from "@/components/ui/input";
import { RefObject, useState, useEffect, useRef } from "react";
import { SearchTooltip } from "./SearchTooltip";
import { validateAndCleanAnagramInput, validateAndCleanPatternInput } from "@/utils/inputValidation";
import { Search, X } from "lucide-react";
import SearchButton from "./search/SearchButton";
import ShorterWordsToggle from "./search/ShorterWordsToggle";

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
  const [isFocused, setIsFocused] = useState(false);
  const cursorPositionRef = useRef<number | null>(null);
  
  // Auto-detect pattern mode based on input
  useEffect(() => {
    const hasPatternChars = letters.includes('?') || letters.includes('^') || letters.includes('$');
    setIsPatternMode(hasPatternChars);
  }, [letters]);

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
    if (cursorPositionRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current
      );
      cursorPositionRef.current = null;
    }
  }, [letters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cursorPositionRef.current = e.target.selectionStart;
    let value = e.target.value.toUpperCase();
    
    // Automatically determine which validation to use based on input
    const hasPatternChars = value.includes('?') || value.includes('^') || value.includes('$');
    value = hasPatternChars ? 
      validateAndCleanPatternInput(value) : 
      validateAndCleanAnagramInput(value);
    
    onInputChange(value);
  };

  const handleButtonClick = () => {
    if (hasActiveSearch && onClear) {
      onClear();
    } else {
      onSearch();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="space-y-2">
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
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="text-xl h-12 text-left pr-12 border border-gray-200 rounded-md w-full transition-all duration-200"
            style={{ paddingRight: '3rem' }}
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {letters ? (
              <button 
                onClick={handleButtonClick}
                className="h-8 w-8 p-0 hover:text-gray-600 transition-colors duration-200"
                disabled={!letters.trim()}
              >
                {hasActiveSearch ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            ) : !isFocused && (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </SearchTooltip>
      <ShorterWordsToggle
        checked={showShorter}
        onCheckedChange={onShowShorterChange}
      />
    </div>
  );
};

export default SearchInput;