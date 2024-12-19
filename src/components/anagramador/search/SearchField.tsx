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

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Ingresa letras o patrón (usa ? para una letra, * para cero o más letras)..."
        value={letters}
        onChange={handleChange}
        onKeyDown={onKeyPress}
        className="text-xl h-12 text-left pr-12 caret-blue-500"
        autoCapitalize="off"
        inputMode="none"
      />
      {letters && (
        <Button
          onClick={letters.trim() ? onClear : undefined}
          onDoubleClick={letters.trim() ? onValidate : undefined}
          variant="ghost"
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 transition-colors ${
            letters.trim() 
              ? "hover:text-red-600 active:text-green-600" 
              : "opacity-50 cursor-not-allowed"
          }`}
          type="button"
          title={letters.trim() ? "Borrar (clic) o Buscar (doble clic)" : "Ingresa letras para buscar"}
        >
          {letters.trim() ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
};

export default SearchField;