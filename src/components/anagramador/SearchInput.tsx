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
      const events = ['click', 'focus', 'select', 'keyup', 'touchend'];
      events.forEach(event => {
        input.addEventListener(event, handleSelectionChange);
      });
      
      input.addEventListener('focus', () => {
        if (window.innerWidth <= 768) {
          setShowKeyboard(true);
        }
      });

      return () => {
        events.forEach(event => {
          input.removeEventListener(event, handleSelectionChange);
        });
      };
    }
  }, [inputRef]);

  const handleValidate = () => {
    onSearch();
    // Focus input after validation to allow continued typing
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
        setCursorPosition(length);
      }
    });
  };

  const handleCustomKeyPress = (key: string) => {
    const input = inputRef.current;
    if (!input) return;

    if (key === "Enter") {
      handleValidate();
      return;
    }

    const currentValue = letters;
    const pos = cursorPosition !== null ? cursorPosition : currentValue.length;

    if (key === "Backspace") {
      if (pos > 0) {
        const newValue = currentValue.slice(0, pos - 1) + currentValue.slice(pos);
        onInputChange(newValue);
        
        // Update cursor position after backspace
        const newPos = pos - 1;
        setCursorPosition(newPos);
        
        requestAnimationFrame(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(newPos, newPos);
          }
        });
      }
      return;
    }

    // Insert the key at cursor position
    const newValue = currentValue.slice(0, pos) + key + currentValue.slice(pos);
    onInputChange(newValue.toUpperCase());
    
    // Update cursor position after insertion
    const newPos = pos + 1;
    setCursorPosition(newPos);
    
    requestAnimationFrame(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidate();
    } else {
      onKeyPress(e);
    }
  };

  return (
    <div className="space-y-2">
      <SearchField
        letters={letters}
        inputRef={inputRef}
        onInputChange={onInputChange}
        onValidate={handleValidate}
        onClear={onClear}
        onKeyPress={handleKeyPress}
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