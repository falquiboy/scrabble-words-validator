import { useState } from "react";
import { wordTrie } from "@/utils/trie";
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
      const isValid = words.every(w => wordTrie.search(w.toUpperCase()));
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
    if (word && !result.checked) {
      handleValidate();
    } else {
      setWord("");
      setResult({ isValid: false, checked: false, words: [] });
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <Header />
      <div className="space-y-4">
        {!result.checked || isEditing ? (
          <WordInput
            word={word}
            isLoading={isLoading}
            onWordChange={setWord}
            onValidate={handleValidate}
            onClear={handleClear}
          />
        ) : (
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