import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchFieldProps {
  letters: string;
  onInputChange: (value: string) => void;
  onValidate: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

const SearchField = ({
  letters,
  onInputChange,
  onValidate,
  onClear,
  onKeyPress,
  isLoading
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
  };

  const handleButtonClick = () => {
    if (!letters.trim()) return;
    
    if (letters.includes('/')) {
      onClear();
    } else {
      onValidate();
    }
  };

  return (
    <div className="relative w-full max-w-[584px] mx-auto">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Ingresa letras o patrón..."
          value={letters}
          onChange={handleChange}
          onKeyDown={onKeyPress}
          className="h-12 pr-10 rounded-full border-2 hover:border-gray-300 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm"
          autoCapitalize="off"
          inputMode="none"
          disabled={isLoading}
        />
        {letters && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleButtonClick}
                  variant="ghost"
                  className={`absolute right-2 h-8 w-8 p-0 hover:bg-transparent ${
                    letters.trim() 
                      ? "text-muted-foreground hover:text-foreground" 
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  type="button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : letters.includes('/') ? (
                    <Trash2 className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {letters.includes('/') ? 'Limpiar búsqueda' : 'Buscar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default SearchField;