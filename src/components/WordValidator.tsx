import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { processDigraphs } from "@/utils/digraphs";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import { Trie } from "@/utils/trie";

interface WordValidatorProps {
  trie: Trie;
  isLoading: boolean;
  error: string | null;
}

const WordValidator = ({ trie, isLoading, error }: WordValidatorProps) => {
  const { toast } = useToast();
  const [word, setWord] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateWord = useCallback((word: string) => {
    const processedWord = processDigraphs(word.toUpperCase());
    const exists = trie.search(processedWord);
    setIsValid(exists);
    toast({
      title: exists ? "Palabra válida" : "Palabra inválida",
      description: exists ? "La palabra existe en el diccionario." : "La palabra no se encuentra en el diccionario.",
    });
  }, [trie, toast]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <Header />
      <WordInput 
        onValidate={validateWord}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default WordValidator;
