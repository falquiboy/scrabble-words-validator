import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { isValidWord, calculateWordScore, updateWordList } from "@/utils/scrabble";
import { loadWordList } from "@/utils/wordList";
import { Check, X, Upload } from "lucide-react";

const WordValidator = () => {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<{
    isValid: boolean;
    score: number;
    checked: boolean;
  }>({ isValid: false, score: 0, checked: false });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = () => {
    if (!word.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce una palabra",
        variant: "destructive",
      });
      return;
    }

    const isValid = isValidWord(word);
    const score = isValid ? calculateWordScore(word) : 0;

    setResult({ isValid, score, checked: true });
    
    toast({
      title: isValid ? "¡Palabra válida!" : "Palabra no válida",
      description: isValid 
        ? `La palabra "${word}" vale ${score} puntos` 
        : `La palabra "${word}" no está en el diccionario`,
      variant: isValid ? "default" : "destructive",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const words = await loadWordList(file);
      updateWordList(words);
      toast({
        title: "¡Diccionario cargado!",
        description: `Se han cargado ${words.size.toLocaleString()} palabras`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el diccionario",
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
            Verifica si tu palabra es válida para Scrabble en español
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Escribe una palabra..."
              value={word}
              onChange={(e) => {
                setWord(e.target.value.toLowerCase());
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
              Validar
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50">
            <Input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="wordlist"
            />
            <label
              htmlFor="wordlist"
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800"
            >
              <Upload size={20} />
              {isLoading ? "Cargando diccionario..." : "Cargar diccionario"}
            </label>
          </div>

          {result.checked && (
            <div className={`p-4 rounded-lg ${
              result.isValid 
                ? "bg-scrabble-valid/10 border border-scrabble-valid" 
                : "bg-scrabble-invalid/10 border border-scrabble-invalid"
              } animate-tile-bounce`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.isValid ? (
                    <Check className="text-scrabble-valid" />
                  ) : (
                    <X className="text-scrabble-invalid" />
                  )}
                  <span className={result.isValid ? "text-scrabble-valid" : "text-scrabble-invalid"}>
                    {result.isValid ? "Palabra válida" : "Palabra no válida"}
                  </span>
                </div>
                {result.isValid && (
                  <div className="text-scrabble-valid font-bold">
                    {result.score} puntos
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordValidator;