import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";

interface SearchHistoryProps {
  history: string[];
  onSelectHistory: (item: string) => void;
  onClearHistory: () => void;
  showKeyboardHints?: boolean;
}

const SearchHistory = ({ 
  history, 
  onSelectHistory, 
  onClearHistory,
  showKeyboardHints = false 
}: SearchHistoryProps) => {
  if (history.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 mt-2">
        No hay búsquedas recientes
        {showKeyboardHints && (
          <div className="text-xs text-gray-400 mt-1">
            Usa ↑/↓ para navegar el historial
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {history.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between group"
        >
          <button
            className="text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => onSelectHistory(item)}
          >
            {item}
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2 text-xs"
        onClick={onClearHistory}
      >
        <X className="h-3 w-3 mr-1" />
        Limpiar historial
      </Button>
    </div>
  );
};

export default SearchHistory;