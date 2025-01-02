import { useState } from "react";
import { Trie } from "@/utils/trie";
import { processDigraphs, toDisplayFormat } from "@/utils/digraphs";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import LoadingIndicator from "./word-validator/LoadingIndicator";
import ValidationResult from "./word-validator/ValidationResult";

interface WordValidatorProps {
  isDictionaryLoading: boolean;
  progress: number;
  trie: Trie;
}

const WordValidator = ({ isDictionaryLoading, progress, trie }: WordValidatorProps) => {
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
      // Split into individual words and process each one
      const words = word.trim().split(" ");
      const isValid = words.every(w => {
        // Process digraphs before validation
        const processedWord = processDigraphs(w.toUpperCase());
        console.log('Validating word:', w, 'processed as:', processedWord);
        return trie.search(processedWord);
      });

      // Store the original words in uppercase for display
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
    setIsEditing(false);
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