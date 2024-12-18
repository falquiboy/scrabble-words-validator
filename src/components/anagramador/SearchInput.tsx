import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useEffect } from "react";
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
  // Prevent mobile keyboard from showing up
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          input.blur();
        }
      });
    }
  }, [inputRef]);

  const handleCustomKeyPress = (key: string) => {
    if (key === "Backspace") {
      // Remove the last character
      onInputChange(letters.slice(0, -1));
      return; // Important: return here to prevent further processing
    }
    
    // Only add the key if it's not a command
    const newValue = letters + key;
    const validValue = newValue.replace(/[^A-ZÑa-zñ\s*?/]/g, '').toUpperCase();
    onInputChange(validValue);
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
            }}
            onKeyPress={onKeyPress}
            className="text-xl h-12 text-left pr-12"
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            inputMode="none"
          />
          {letters && (
            <Button
              onClick={onClear}
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
      <CustomKeyboard onKeyPress={handleCustomKeyPress} onClear={onClear} />
    </div>
  );
};

export default SearchInput;