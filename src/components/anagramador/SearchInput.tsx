import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useRef } from "react";

interface SearchInputProps {
  letters: string;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const SearchInput = ({ letters, onInputChange, onSearch, onClear, onKeyPress }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ingresa letras..."
          value={letters}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
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
  );
};

export default SearchInput;