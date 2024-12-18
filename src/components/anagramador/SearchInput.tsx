import { RefObject, useEffect, useState } from "react";
import CustomKeyboard from "./CustomKeyboard";
import SearchField from "./search/SearchField";
import ShorterWordsToggle from "./search/ShorterWordsToggle";

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
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // Handle cursor position changes
  const handleSelectionChange = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  };

  // Update cursor position on input focus and click
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener('click', handleSelectionChange);
      input.addEventListener('focus', handleSelectionChange);
      input.addEventListener('select', handleSelectionChange);
      
      input.addEventListener('focus', () => {
        if (window.innerWidth <= 768) {
          setShowKeyboard(true);
        }
      });
    }

    return () => {
      if (input) {
        input.removeEventListener('click', handleSelectionChange);
        input.removeEventListener('focus', handleSelectionChange);
        input.removeEventListener('select', handleSelectionChange);
      }
    };
  }, [inputRef]);

  const handleCustomKeyPress = (key: string) => {
    const input = inputRef.current;
    if (!input) return;

    if (key === "Enter") {
      onSearch();
      return;
    }

    const currentValue = letters;
    const pos = cursorPosition !== null ? cursorPosition : currentValue.length;

    if (key === "Backspace") {
      if (pos > 0) {
        const newValue = currentValue.slice(0, pos - 1) + currentValue.slice(pos);
        onInputChange(newValue);
        setCursorPosition(pos - 1);
        
        requestAnimationFrame(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(pos - 1, pos - 1);
          }
        });
      }
      return;
    }

    // Insert the key at cursor position
    const newValue = currentValue.slice(0, pos) + key + currentValue.slice(pos);
    const validValue = newValue.replace(/[^A-ZÑa-zñ\s*?/]/g, '').toUpperCase();
    onInputChange(validValue);
    
    // Update cursor position
    const newPos = pos + 1;
    setCursorPosition(newPos);
    
    requestAnimationFrame(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(newPos, newPos);
      }
    });
  };

  return (
    <div className="space-y-2">
      <SearchField
        letters={letters}
        inputRef={inputRef}
        onInputChange={onInputChange}
        onSearch={onSearch}
        onClear={onClear}
        onKeyPress={onKeyPress}
        setCursorPosition={setCursorPosition}
      />
      <ShorterWordsToggle
        showShorter={showShorter}
        onShowShorterChange={onShowShorterChange}
      />
      {showKeyboard && (
        <CustomKeyboard 
          onKeyPress={handleCustomKeyPress} 
          onClear={onClear}
          onToggle={() => setShowKeyboard(!showKeyboard)}
          showKeyboard={showKeyboard}
        />
      )}
    </div>
  );
};

export default SearchInput;