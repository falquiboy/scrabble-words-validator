
import { useState, useEffect } from "react";
import type { LexiconMode, WordSearchService } from '@/lexicon/types';
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import LoadingIndicator from "./word-validator/LoadingIndicator";
import ValidationResult from "./word-validator/ValidationResult";
import type { LoadingStage } from '@/hooks/useWordTrie';
import { Check, Database, Zap } from "lucide-react";

interface WordValidatorProps {
  isDictionaryLoading: boolean;
  progress: number;
  trie: WordSearchService;
  mode: LexiconMode;
  stage?: LoadingStage;
  wordCount?: number;
  isTrieBuilding?: boolean;
  isTrieReady?: boolean;
}

const WordValidator = ({ 
  isDictionaryLoading, 
  progress, 
  trie,
  stage = 'processing',
  wordCount = 0,
  isTrieBuilding = false,
  isTrieReady = false
  ,mode
}: WordValidatorProps) => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
    wordStatuses?: boolean[];
  }>({ isValid: false, checked: false, words: [] });
  const [currentProvider, setCurrentProvider] = useState<'trie' | 'sqlite' | 'supabase' | 'none'>('none');

  useEffect(() => {
    setResult({ isValid: false, checked: false, words: [] });
  }, [mode]);

  // Actualizar provider status periódicamente
  useEffect(() => {
    const updateProvider = () => {
      const provider = trie.getCurrentProvider();
      setCurrentProvider(provider);
    };

    // Actualizar inmediatamente
    updateProvider();

    if (!isTrieBuilding) return;

    // The provider changes without replacing the service instance, so poll only
    // while the optional background promotion is active.
    const interval = setInterval(() => {
      const provider = trie.getCurrentProvider();
      setCurrentProvider(provider);
      
      if (provider === 'trie') {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [trie, isDictionaryLoading, isTrieBuilding, isTrieReady]);

  const handleValidate = async () => {
    if (!word.trim() || isDictionaryLoading) return;

    setIsLoading(true);
    try {
      // Split into individual words and process each one
      const words = word.trim().split(" ");
      console.log('Validating words:', words);
      
      // Get individual word validation results
      const wordResults = await Promise.all(words.map(async (w) => {
        // Convert to uppercase without processing digraphs yet
        const upperWord = w.toUpperCase();
        console.log('Validating word:', w, 'uppercase:', upperWord);
        
        // Use async search with fallback to Supabase
        const found = await trie.searchAsync(upperWord);
        console.log('Word found?', found);
        return found;
      }));
      
      // Overall validation is valid only if ALL words are valid
      const isValid = wordResults.every(result => result);

      // Store the original words in uppercase for display with individual statuses
      setResult({ 
        isValid, 
        checked: true, 
        words: words.map(w => w.toUpperCase()),
        wordStatuses: wordResults 
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

  const handleWordChange = (newWord: string) => {
    setWord(newWord);
    if (newWord !== word) {
      setResult(prev => ({ ...prev, checked: false }));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-4">
        <Header />
        <WordInput
          word={word}
          isLoading={isDictionaryLoading || isLoading}
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
            stage={stage}
          />
        )}
      </div>
      
      {/* Fallback method indicator - bottom left */}
      {!isDictionaryLoading && (
        <div className="fixed bottom-4 left-4 bg-white shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-600 border border-gray-200">
          {currentProvider === 'trie' ? (
            <>
              <Zap size={14} className="text-yellow-600" />
              <span>Trie</span>
            </>
          ) : currentProvider === 'sqlite' ? (
            <>
              <Database size={14} className="text-blue-600" />
              <span>SQLite</span>
            </>
          ) : currentProvider === 'supabase' ? (
            <>
              <Database size={14} className="text-green-600" />
              <span>Supabase</span>
            </>
          ) : (
            <>
              <Database size={14} className="text-gray-400" />
              <span>Cargando...</span>
            </>
          )}
        </div>
      )}
      
      {/* Permanent dictionary status indicator */}
      {wordCount > 0 && !isDictionaryLoading && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-gray-700 border border-gray-200">
          <Check size={16} className="text-green-600" />
          <span>{wordCount.toLocaleString('en-US')} palabras</span>
        </div>
      )}
    </div>
  );
};

export default WordValidator;
