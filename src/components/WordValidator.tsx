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
  const [loadStartTime] = useState(Date.now());

  const handleValidate = async () => {
    if (!word.trim() || isDictionaryLoading) return;

    setIsLoading(true);
    try {
      // Split into individual words and process each one
      const words = word.trim().split(" ");
      console.log('Validating words:', words);
      
      // Get all words from trie for debugging
      const allWords = trie.getAllWords();
      console.log('Total words in trie:', allWords.length);
      
      const isValid = words.every(w => {
        // Convert to uppercase without processing digraphs yet
        const upperWord = w.toUpperCase();
        console.log('Validating word:', w, 'uppercase:', upperWord);
        
        // Search in trie directly with the original word
        const found = trie.search(upperWord);
        console.log('Word found in trie?', found);
        return found;
      });

      // Store the original words in uppercase for display
      setResult({ 
        isValid, 
        checked: true, 
        words: words.map(w => w.toUpperCase()) 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (isLoading) return;
    setWord("");
    setResult({ isValid: false, checked: false, words: [] });
  };

  // When the word changes, we're in editing mode
  const handleWordChange = (newWord: string) => {
    setWord(newWord);
    // Only reset validation if the word actually changed
    if (newWord !== word) {
      setResult(prev => ({ ...prev, checked: false }));
    }
  };

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <Header />
      <div className="space-y-4">
        <WordInput
          word={word}
          isLoading={isLoading}
          onWordChange={handleWordChange}
          onValidate={result.checked ? handleClear : handleValidate}
          buttonText={result.checked ? "Limpiar" : "Validar"}
          isChecked={result.checked}
        />
        
        {result.checked && (
          <ValidationResult
            word={word}
            result={result}
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