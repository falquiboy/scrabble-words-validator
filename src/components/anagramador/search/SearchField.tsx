import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Check } from "lucide-react";
import { RefObject } from "react";

interface SearchFieldProps {
  letters: string;
  inputRef: RefObject<HTMLInputElement>;
  onInputChange: (value: string) => void;
  onValidate: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  setCursorPosition: (position: number | null) => void;
}

const SearchField = ({
  letters,
  inputRef,
  onInputChange,
  onValidate,
  onClear,
  onKeyPress,
  setCursorPosition
}: SearchFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parts = value.split('/');
    
    if (parts.length > 1) {
      const pattern = parts[0].replace(/[^A-ZÑa-zñ\s*?]/g, '');
      const rack = parts[1].replace(/[^A-ZÑa-zñ\s*]/g, '');
      const newValue = `${pattern}/${rack}`;
      onInputChange(newValue.toUpperCase());
    } else {
      const validPattern = value.replace(/[^A-ZÑa-zñ\s*?]/g, '');
      onInputChange(validPattern.toUpperCase());
    }
    
    // Update cursor position after onChange
    requestAnimationFrame(() => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }
    });
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ingresa letras o patrón (usa ? para una letra, * para cero o más letras)..."
          value={letters}
          onChange={handleChange}
          onKeyDown={onKeyPress}
          className="text-xl h-12 text-left pr-24 caret-blue-500"
          autoCapitalize="off"
          inputMode="none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {letters && (
            <>
              <Button
                onClick={onValidate}
                variant="ghost"
                className="h-8 w-8 p-0 hover:text-green-600"
                type="button"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                onClick={onClear}
                variant="ghost"
                className="h-8 w-8 p-0 hover:text-red-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <Button 
        onClick={onValidate}
        className="h-12 w-12 p-0"
        variant="default"
        disabled={!letters.trim()}
      >
        <Search className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default SearchField;