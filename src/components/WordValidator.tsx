import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { isValidWord } from "@/utils/scrabble";
import { Check, X, Gavel } from "lucide-react";

const WordValidator = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
  }>({ isValid: false, checked: false });
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleValidate = async () => {
    if (!word.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce una palabra",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const validationResults = await Promise.all(
        words.map((w) => isValidWord(w))
      );
      
      const isValid = validationResults.every((result) => result === true);
      setResult({ isValid, checked: true });
      
      if (words.length > 1) {
        toast({
          title: isValid ? "¡Jugada válida!" : "Jugada no válida",
          description: isValid 
            ? "Todas las palabras son válidas" 
            : "Una o más palabras no están en el diccionario",
          variant: isValid ? "default" : "destructive",
        });
      } else {
        toast({
          title: isValid ? "¡Palabra válida!" : "Palabra no válida",
          description: isValid 
            ? `La palabra "${word}" es válida` 
            : `La palabra "${word}" no está en el diccionario`,
          variant: isValid ? "default" : "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al validar la palabra",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setWord("");
    setResult({ isValid: false, checked: false });
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-scrabble-wood/20 to-scrabble-wood/5 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-md space-y-4 p-4 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gavel className="h-8 w-8 text-scrabble-dark" />
            <h1 className="text-4xl font-bold text-scrabble-dark">
              Juez de Léxico
            </h1>
          </div>
        </div>

        <div className="space-y-4">
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
            className="text-2xl font-bold h-16 text-center"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleValidate();
              }
            }}
            autoFocus
          />

          <div className="flex justify-center gap-4">
            <Button 
              onClick={handleClear}
              variant="outline"
              className="text-scrabble-dark hover:bg-gray-100 text-lg px-8"
            >
              Limpiar
            </Button>
            <Button 
              onClick={handleValidate}
              className="bg-scrabble-green hover:bg-scrabble-green/90 text-lg px-8"
              disabled={isLoading}
            >
              {isLoading ? "Validando..." : "Validar"}
            </Button>
          </div>

          {result.checked && (
            <div className={`p-4 rounded-lg ${
              result.isValid 
                ? "bg-scrabble-valid/10 border border-scrabble-valid" 
                : "bg-scrabble-invalid/10 border border-scrabble-invalid"
              } animate-tile-bounce`}>
              <div className="flex items-center gap-2">
                {result.isValid ? (
                  <Check className="text-scrabble-valid h-6 w-6" />
                ) : (
                  <X className="text-scrabble-invalid h-6 w-6" />
                )}
                <span className={`${result.isValid ? "text-scrabble-valid" : "text-scrabble-invalid"} text-xl`}>
                  {word.includes(" ") 
                    ? (result.isValid ? "Jugada válida" : "Jugada no válida")
                    : (result.isValid ? "Palabra válida" : "Palabra no válida")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordValidator;