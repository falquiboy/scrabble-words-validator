import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, History } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useState } from "react";

interface WordInputProps {
  word: string;
  isLoading: boolean;
  result: {
    isValid: boolean;
    checked: boolean;
    words: string[];
  };
  isEditing: boolean;
  onWordChange: (word: string) => void;
  onValidate: () => void;
  onClear: () => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}

const WordInput = ({
  word,
  isLoading,
  result,
  isEditing,
  onWordChange,
  onValidate,
  onClear,
  onEditStart,
  onEditEnd,
}: WordInputProps) => {
  const { history, addToHistory, clearHistory, navigateHistory } = useSearchHistory('judge');
  const [inputValue, setInputValue] = useState(word);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = navigateHistory(e.key === 'ArrowUp' ? 'up' : 'down', word);
      onWordChange(newValue);
    } else if (e.key === 'Enter' && !isLoading) {
      if (result.checked) {
        onClear();
      } else {
        onValidate();
        addToHistory(word);
      }
    }
  };

  const handleValidateClick = () => {
    if (result.checked) {
      onClear();
    } else {
      onValidate();
      addToHistory(word);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={word}
        onChange={(e) => onWordChange(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        className={`text-xl h-12 text-left pr-24 transition-colors ${
          result.checked
            ? result.isValid
              ? "border-green-500 focus-visible:ring-green-500"
              : "border-red-500 focus-visible:ring-red-500"
            : ""
        }`}
        placeholder="Escribe una palabra"
        disabled={isLoading}
        onFocus={() => {
          if (result.checked) onEditStart();
        }}
        onBlur={() => {
          if (result.checked && !result.isValid) onEditEnd();
        }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[40vh]">
            <SheetHeader>
              <SheetTitle>Historial de búsquedas</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => {
                        onWordChange(item);
                        const trigger = document.querySelector('[data-radix-collection-item]');
                        if (trigger) {
                          (trigger as HTMLElement).click();
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={clearHistory}
                  >
                    Limpiar historial
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-500">No hay búsquedas recientes</p>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <Button
          onClick={handleValidateClick}
          className="h-8 w-8 p-0"
          variant="ghost"
          disabled={isLoading || !word.trim()}
        >
          {result.checked ? (
            result.isValid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default WordInput;