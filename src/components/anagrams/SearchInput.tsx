import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader } from "lucide-react";
import { useRef } from "react";

interface SearchInputProps {
  letters: string;
  isLoading: boolean;
  onLettersChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

const SearchInput = ({ letters, isLoading, onLettersChange, onSearch, onClear }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-Z]/g, '');
    onLettersChange(sanitizedValue.toUpperCase());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2 max-w-full px-4 sm:px-0">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ingresa letras..."
          value={letters}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-2xl font-bold h-16 text-left pr-12"
          autoFocus
        />
        {letters && (
          <Button
            onClick={onClear}
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0"
            type="button"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
      <Button 
        onClick={onSearch}
        className="h-16 px-6 shrink-0"
        variant="default"
        disabled={!letters.trim()}
      >
        {isLoading ? (
          <Loader className="h-6 w-6 animate-spin" />
        ) : (
          <Search className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};

export default SearchInput;