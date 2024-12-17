import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject } from "react";

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
              // Allow * and ? in pattern (before /) but only * in rack letters (after /)
              const [pattern, rack] = value.split('/');
              if (rack) {
                // If there's a rack part, validate it separately
                const validRack = rack.replace(/[^A-ZÑa-zñ\s*]/g, '');
                const newValue = `${pattern}/${validRack}`;
                onInputChange(newValue.toUpperCase());
              } else {
                // If no rack part, allow * and ? anywhere
                const validPattern = value.replace(/[^A-ZÑa-zñ\s*?/]/g, '');
                onInputChange(validPattern.toUpperCase());
              }
            }}
            onKeyPress={onKeyPress}
            className="text-xl h-12 text-left pr-12"
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
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
    </div>
  );
};

export default SearchInput;