import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { isValidWord } from "@/utils/scrabble";
import { Check, X } from "lucide-react";

const WordValidator = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
  }>({ isValid: false, checked: false });
  const { toast } = useToast();

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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-scrabble-wood/20 to-scrabble-wood/5 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-scrabble-dark mb-2">
            Validador de Scrabble
          </h1>
          <p className="text-scrabble-dark/80">
            Verifica si tus palabras son válidas para Scrabble en español
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Escribe una o más palabras..."
              value={word}
              onChange={(e) => {
                setWord(e.target.value.toUpperCase());
                if (result.checked) {
                  setResult({ ...result, checked: false });
                }
              }}
              className="text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValidate();
                }
              }}
            />
            <Button 
              onClick={handleValidate}
              className="bg-scrabble-green hover:bg-scrabble-green/90"
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
                  <Check className="text-scrabble-valid" />
                ) : (
                  <X className="text-scrabble-invalid" />
                )}
                <span className={result.isValid ? "text-scrabble-valid" : "text-scrabble-invalid"}>
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