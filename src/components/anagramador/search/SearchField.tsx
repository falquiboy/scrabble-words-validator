import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
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
    
    requestAnimationFrame(() => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }
    });
  };

  const handleButtonClick = () => {
    if (letters.trim()) {
      if (!letters.includes('/')) {
        onValidate();
      } else {
        onClear();
      }
    }
  };

  return (
    <div className="relative w-full max-w-[584px] mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ingresa letras o patrón..."
          value={letters}
          onChange={handleChange}
          onKeyDown={onKeyPress}
          className="h-12 pl-10 pr-10 rounded-full border-2 hover:border-gray-300 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm"
          autoCapitalize="off"
          inputMode="none"
        />
        {letters && (
          <Button
            onClick={handleButtonClick}
            variant="ghost"
            className={`absolute right-2 h-8 w-8 p-0 hover:bg-transparent ${
              letters.trim() 
                ? "text-muted-foreground hover:text-foreground" 
                : "opacity-50 cursor-not-allowed"
            }`}
            type="button"
            title={letters.trim() ? "Buscar o borrar" : "Ingresa letras para buscar"}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchField;