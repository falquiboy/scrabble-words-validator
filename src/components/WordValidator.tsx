import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, toDisplayFormat } from "@/utils/digraphs";

const WordValidator = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
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
      inputRef.current?.focus();
    }
  };

  const getInputBackground = () => {
    if (!result.checked) return "bg-white text-black";
    return result.isValid 
      ? "bg-scrabble-valid text-white" 
      : "bg-scrabble-invalid text-white";
  };

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gavel className="h-8 w-8 text-scrabble-dark" />
          <h1 className="text-4xl font-bold text-scrabble-dark">
            Juez de Léxico
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Escribe una o más palabras..."
            value={word}
            onChange={(e) => {
              setWord(e.target.value.toUpperCase());
              if (result.checked) {
                setResult({ ...result, checked: false });
              }
            }}
            className={`text-[32px] leading-normal font-bold min-h-[8rem] text-left pr-12 transition-colors whitespace-normal break-words ${getInputBackground()}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleClear();
              }
            }}
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            style={{ wordSpacing: '0.5em' }}
          />
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