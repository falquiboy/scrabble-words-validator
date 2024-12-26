import { useState, useCallback, useRef } from "react";
import { processDigraphs } from "@/utils/digraphs";
import { wordTrie } from "@/utils/trie";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import { useDebouncedCallback } from "use-debounce";

interface WordValidatorProps {
  isDictionaryLoading: boolean;
}

const BATCH_SIZE = 5; // Process words in smaller batches
const DEBOUNCE_MS = 500; // Increased debounce time

const WordValidator = ({ isDictionaryLoading }: WordValidatorProps) => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
  const [isEditing, setIsEditing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const processWordBatch = async (words: string[], signal: AbortSignal): Promise<boolean> => {
    return new Promise((resolve) => {
      // Use requestIdleCallback if available, otherwise use setTimeout
      const scheduleWork = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
      
      scheduleWork(() => {
        if (signal.aborted) {
          resolve(false);
          return;
        }

        const isValid = words.every(w => {
          if (!w) return false;
          return wordTrie.search(w);
        });

        resolve(isValid);
      });
    });
  };

  const handleValidate = useDebouncedCallback(async () => {
    if (!word.trim() || isDictionaryLoading) return;

    // Cancel any ongoing validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this validation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const processedWords = words.map(w => {
        let upperWord = w.toUpperCase();
        
        upperWord = upperWord.split('').map(char => {
          if (char === 'Ñ' || char === 'ñ') return 'Ñ';
          return char
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .normalize('NFC');
        }).join('');
        
        return processDigraphs(upperWord);
      });

      // Process words in batches
      const batches = [];
      for (let i = 0; i < processedWords.length; i += BATCH_SIZE) {
        batches.push(processedWords.slice(i, i + BATCH_SIZE));
      }

      let isValid = true;
      for (const batch of batches) {
        if (signal.aborted) {
          return;
        }

        const batchResult = await processWordBatch(batch, signal);
        if (!batchResult) {
          isValid = false;
          break;
        }

        // Small delay between batches to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      if (!signal.aborted) {
        setResult({ 
          isValid, 
          checked: true, 
          words: words.map(w => w.toUpperCase()) 
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Validation error:', error);
      if (!signal.aborted) {
        setResult({
          isValid: false,
          checked: true,
          words: []
        });
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, DEBOUNCE_MS);

  const handleClear = () => {
    if (isLoading) {
      // Cancel ongoing validation if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsLoading(false);
    }
    
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
