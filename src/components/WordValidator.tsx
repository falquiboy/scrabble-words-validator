import { useState, useCallback } from "react";
import { processDigraphs } from "@/utils/digraphs";
import { wordTrie } from "@/utils/trie";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import { useDebouncedCallback } from "use-debounce";

interface WordValidatorProps {
  isDictionaryLoading: boolean;
}

const DEBOUNCE_MS = 300;

const WordValidator = ({ isDictionaryLoading }: WordValidatorProps) => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
  const [isEditing, setIsEditing] = useState(false);

  const handleValidate = useDebouncedCallback(() => {
    if (!word.trim() || isDictionaryLoading) return;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const processedWords = words.map(w => {
        let upperWord = w.toUpperCase();
        
        // Handle Ñ separately first
        upperWord = upperWord.split('').map(char => {
          if (char === 'Ñ' || char === 'ñ') return 'Ñ';
          return char
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .normalize('NFC');
        }).join('');
        
        // Process digraphs after normalization
        return processDigraphs(upperWord);
      });

      // Simple validation of all words
      const isValid = processedWords.every(w => {
        if (!w) return false;
        return wordTrie.search(w);
      });

      setResult({ 
        isValid, 
        checked: true, 
        words: words.map(w => w.toUpperCase()) 
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Validation error:', error);
      setResult({
        isValid: false,
        checked: true,
        words: []
      });
    } finally {
      setIsLoading(false);
    }
  }, DEBOUNCE_MS);

  const handleClear = () => {
    if (word && !result.checked) {
      handleValidate();
    } else {
      setWord("");
      setResult({ isValid: false, checked: false, words: [] });
      setIsEditing(false);
    }
  };

  const handleWordChange = useCallback((newWord: string) => {
    setWord(newWord);
    if (result.checked) {
      setResult(prev => ({ ...prev, checked: false }));
    }
  }, [result.checked]);

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <Header />
      <div className="space-y-4">
        <WordInput
          word={word}
          isLoading={isLoading}
          result={result}
          isEditing={isEditing}
          onWordChange={handleWordChange}
          onValidate={handleValidate}
          onClear={handleClear}
          onEditStart={() => setIsEditing(true)}
          onEditEnd={() => setIsEditing(false)}
        />
        {isDictionaryLoading && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Cargando lexicón...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordValidator;