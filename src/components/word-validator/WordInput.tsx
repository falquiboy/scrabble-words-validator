import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import SearchHistory from "@/components/shared/SearchHistory";

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
  const { history, addToHistory, clearHistory } = useSearchHistory('judge');

  const handleValidateClick = () => {
    if (result.checked) {
      onClear();
    } else {
      onValidate();
      addToHistory(word);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          value={word}
          onChange={(e) => onWordChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              if (result.checked) {
                onClear();
              } else {
                onValidate();
                addToHistory(word);
              }
            }
          }}
          className={`text-xl h-12 text-left pr-12 transition-colors ${
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
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
      <SearchHistory
        history={history}
        onSelectHistory={onWordChange}
        onClearHistory={clearHistory}
      />
    </div>
  );
};

export default WordInput;