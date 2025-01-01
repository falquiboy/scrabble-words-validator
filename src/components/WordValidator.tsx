import { useState } from "react";
import { wordTrie } from "@/utils/trie";
import { processDigraphs } from "@/utils/digraphs";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import LoadingIndicator from "./word-validator/LoadingIndicator";
import ValidationResult from "./word-validator/ValidationResult";

interface WordValidatorProps {
  isDictionaryLoading: boolean;
  progress: number;
}

const WordValidator = ({ isDictionaryLoading, progress }: WordValidatorProps) => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const handleValidate = async () => {
    if (!word.trim() || isDictionaryLoading) return;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const isValid = words.every(w => {
        const processedWord = processDigraphs(w.toUpperCase());
        return wordTrie.search(processedWord);
      });
      setResult({ 
        isValid, 
        checked: true, 
        words: words.map(w => w.toUpperCase()) 
      });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (isLoading) return;
    setWord("");
    setResult({ isValid: false, checked: false, words: [] });
    setIsEditing(true);
  };

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <Header />
      <div className="space-y-4">
        <WordInput
          word={word}
          isLoading={isLoading}
          onWordChange={setWord}
          onValidate={handleValidate}
          onClear={handleClear}
          isValidated={result.checked && !isEditing}
        />
        {result.checked && !isEditing && (
          <ValidationResult
            word={word}
            result={result}
            onEditStart={() => setIsEditing(true)}
          />
        )}
        {isDictionaryLoading && (
          <LoadingIndicator 
            progress={progress} 
            loadStartTime={loadStartTime} 
          />
        )}
      </div>
    </div>
  );
};

export default WordValidator;