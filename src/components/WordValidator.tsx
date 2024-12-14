import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, toDisplayFormat } from "@/utils/digraphs";
import { ScrollArea } from "@/components/ui/scroll-area";

const WordValidator = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleValidate = async () => {
    if (!word.trim()) return;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const processedWords = words.map(w => processDigraphs(w));
      
      const { data: validWords, error } = await supabase
        .from('words')
        .select('word')
        .in('word', processedWords);

      if (error) throw error;

      const validWordSet = new Set(validWords?.map(w => w.word) || []);
      const isValid = processedWords.every(w => validWordSet.has(w));
      
      setResult({ 
        isValid, 
        checked: true, 
        words: words.map(w => w.toUpperCase()) 
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    if (isLoading) return;
    
    if (word && !result.checked) {
      handleValidate();
    } else {
      setWord("");
      setResult({ isValid: false, checked: false, words: [] });
      setIsEditing(false);
      inputRef.current?.focus();
    }
  };

  const getInputBackground = () => {
    if (!result.checked) return "bg-white text-black";
    return result.isValid 
      ? "bg-scrabble-valid text-white" 
      : "bg-scrabble-invalid text-white";
  };

  const handleInputClick = () => {
    if (result.checked) {
      setIsEditing(true);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img 
            src="/lovable-uploads/ca9a9ae9-40fb-4d60-a8f9-1ab45c41ee96.png" 
            alt="File Logo" 
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-3xl font-bold text-white uppercase tracking-wide [text-shadow:_2px_2px_0_#F97316] border-[#F97316]">
            Juez de Léxico
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <ScrollArea className={`h-32 rounded-md ${getInputBackground()}`}>
            <div className={`p-3 min-h-full ${getInputBackground()}`}>
              {result.checked && !isEditing ? (
                <div 
                  className="relative" 
                  onClick={handleInputClick}
                >
                  <div className="flex flex-wrap gap-2">
                    {word.split(" ").map((w, i) => (
                      <span key={i} className="text-2xl font-bold">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={!result.checked ? "Escribe una o más palabras..." : ""}
                  value={word}
                  onChange={(e) => {
                    setWord(e.target.value.toUpperCase());
                    if (result.checked) {
                      setResult({ ...result, checked: false });
                    }
                  }}
                  className={`w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleValidate();
                    }
                  }}
                  onBlur={() => {
                    if (result.checked && !word.trim()) {
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              )}
            </div>
          </ScrollArea>
          {word && (
            <Button
              onClick={handleClear}
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-transparent"
              type="button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
              ) : result.checked ? (
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              ) : (
                <Check className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordValidator;
