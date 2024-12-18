import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useEffect, useState } from "react";
import CustomKeyboard from "./CustomKeyboard";

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
      
      // Don't prevent focus on mobile anymore
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

    const currentValue = letters;
    const pos = cursorPosition !== null ? cursorPosition : currentValue.length;

    if (key === "Backspace") {
      if (pos > 0) {
        const newValue = currentValue.slice(0, pos - 1) + currentValue.slice(pos);
        onInputChange(newValue);
        setCursorPosition(pos - 1);
        
        // Set cursor position after state update
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(pos - 1, pos - 1);
          }
        }, 0);
      }
      return;
    }
    
    if (key === "Enter") {
      onSearch();
      return;
    }

    // Insert the key at cursor position
    const newValue = currentValue.slice(0, pos) + key + currentValue.slice(pos);
    const validValue = newValue.replace(/[^A-ZÑa-zñ\s*?/]/g, '').toUpperCase();
    onInputChange(validValue);
    
    // Update cursor position
    const newPos = pos + 1;
    setCursorPosition(newPos);
    
    // Set cursor position after state update
    setTimeout(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ingresa letras o patrón (usa ? para una letra, * para cero o más letras)..."
            value={letters}
            onChange={(e) => {
              const value = e.target.value;
              // Split input into pattern and rack parts if "/" is present
              const parts = value.split('/');
              
              if (parts.length > 1) {
                // Handle pattern and rack separately
                const pattern = parts[0];
                const rack = parts[1];
                // Allow *, ? and letters in pattern
                const validPattern = pattern.replace(/[^A-ZÑa-zñ\s*?]/g, '');
                // Only allow * and letters in rack
                const validRack = rack.replace(/[^A-ZÑa-zñ\s*]/g, '');
                const newValue = `${validPattern}/${validRack}`;
                onInputChange(newValue.toUpperCase());
              } else {
                // If no rack part, allow *, ? and letters
                const validPattern = value.replace(/[^A-ZÑa-zñ\s*?]/g, '');
                onInputChange(validPattern.toUpperCase());
              }
              
              // Update cursor position after onChange
              setTimeout(() => {
                if (inputRef.current) {
                  setCursorPosition(inputRef.current.selectionStart);
                }
              }, 0);
            }}
            onKeyPress={onKeyPress}
            className="text-xl h-12 text-left pr-24 caret-blue-500"
            autoCapitalize="off"
            inputMode="none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {letters && (
              <Button
                onClick={onClear}
                variant="ghost"
                className="h-8 w-8 p-0"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Button 
          onClick={onSearch}
          className="h-12 w-12 p-0"
          variant="default"
          disabled={!letters.trim()}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
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