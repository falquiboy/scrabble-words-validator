import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RefObject, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const MAX_RACK_LETTERS = 7;
const MAX_PATTERN_LENGTH = 10;

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
  const [isPatternMode, setIsPatternMode] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    if (isPatternMode) {
      // Split into pattern and rack parts if comma exists
      const parts = value.split(',');
      
      if (parts.length > 1) {
        // Keep only the first two parts if multiple commas
        let [patternPart, rackPart] = parts;
        
        // Handle pattern part (before comma) - allow ?, -, and letters
        patternPart = patternPart.replace(/[^A-ZÑ?\-,]/g, '');
        
        // Limit pattern length
        if (patternPart.length > MAX_PATTERN_LENGTH) {
          toast({
            title: "Límite excedido",
            description: `El patrón no puede tener más de ${MAX_PATTERN_LENGTH} posiciones.`,
            variant: "destructive",
          });
          patternPart = patternPart.slice(0, MAX_PATTERN_LENGTH);
        }
        
        // Handle rack part (after comma) - only letters
        rackPart = rackPart.replace(/[^A-ZÑ]/g, '');
        
        // Limit rack letters
        if (rackPart.length > MAX_RACK_LETTERS) {
          toast({
            title: "Límite excedido",
            description: `No puedes usar más de ${MAX_RACK_LETTERS} letras en el atril.`,
            variant: "destructive",
          });
          rackPart = rackPart.slice(0, MAX_RACK_LETTERS);
        }
        
        // Combine parts back together
        value = `${patternPart},${rackPart}`;
      } else {
        // If no comma, treat as pattern part - allow ?, -, and letters
        value = value.replace(/[^A-ZÑ?\-,]/g, '');
        
        // Limit pattern length
        if (value.length > MAX_PATTERN_LENGTH) {
          toast({
            title: "Límite excedido",
            description: `El patrón no puede tener más de ${MAX_PATTERN_LENGTH} posiciones.`,
            variant: "destructive",
          });
          value = value.slice(0, MAX_PATTERN_LENGTH);
        }
      }
    } else {
      // In anagram mode, allow letters, *, /, numbers, and commas
      value = value.replace(/[^A-ZÑ*/0-9,/]/g, '');
      
      // If not a length constraint (no /), limit to MAX_RACK_LETTERS
      if (!value.includes('/') && value.replace(/[^A-ZÑ]/g, '').length > MAX_RACK_LETTERS) {
        toast({
          title: "Límite excedido",
          description: `No puedes usar más de ${MAX_RACK_LETTERS} letras en el atril.`,
          variant: "destructive",
        });
        // Keep only the first MAX_RACK_LETTERS letters
        const letters = value.replace(/[^A-ZÑ]/g, '');
        value = letters.slice(0, MAX_RACK_LETTERS);
      }
    }
    
    onInputChange(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-2">
        <Switch
          id="pattern-mode"
          checked={isPatternMode}
          onCheckedChange={setIsPatternMode}
        />
        <label
          htmlFor="pattern-mode"
          className="text-sm text-gray-600 cursor-pointer"
        >
          Modo patrón
        </label>
      </div>
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={isPatternMode ? 
                    "Patrón (ej: C?SA) o Patrón,fichas (ej: C?SA,CASA)" : 
                    "Letras (ej: CASA, CAS*, CASA/4)"
                  }
                  value={letters}
                  onChange={handleInputChange}
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
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              {isPatternMode ? (
                <>
                  <p className="mb-2">Busca palabras usando patrones:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li><strong>?</strong> - una letra cualquiera</li>
                    <li><strong>-</strong> - cero o más letras</li>
                    <li>Opcionalmente, después de una coma, ingresa las fichas disponibles (máx. {MAX_RACK_LETTERS})</li>
                  </ul>
                  <p className="mt-2">Ejemplos:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>"C?SA" - palabras como CASA, COSA (usando cualquier letra)</li>
                    <li>"C?SA,CASA" - palabras como CASA, COSA usando las letras CASA</li>
                    <li>"C-R,AEIOU" - palabras que empiezan con C y terminan en R usando AEIOU</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="mb-2">Busca anagramas:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>Ingresa las letras disponibles (máx. {MAX_RACK_LETTERS})</li>
                    <li><strong>*</strong> - comodín (cualquier letra)</li>
                    <li><strong>/N</strong> - palabras de N letras (ej: CASA/4)</li>
                  </ul>
                  <p className="mt-2">Ejemplos:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>"CASA" - anagramas usando esas letras</li>
                    <li>"CAS*" - anagramas usando un comodín</li>
                    <li>"CASA/4" - palabras de 4 letras usando CASA</li>
                  </ul>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
