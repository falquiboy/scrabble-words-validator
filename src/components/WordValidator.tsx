import { useState } from "react";
import { processDigraphs } from "@/utils/digraphs";
import { wordTrie } from "@/utils/trie";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";

interface WordValidatorProps {
  isDictionaryLoading: boolean;
}

const WordValidator = ({ isDictionaryLoading }: WordValidatorProps) => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
  const [isEditing, setIsEditing] = useState(false);

  const handleValidate = async () => {
    if (!word.trim() || isDictionaryLoading) return;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const processedWords = words.map(w => {
        // First convert to uppercase and handle special characters
        let upperWord = w.toUpperCase();
        upperWord = upperWord.split('').map(char => {
          // Allow direct digraph input (Ç, K, W) to pass through
          if (['Ç', 'K', 'W'].includes(char)) return char;
          if (char === 'Ñ' || char === 'ñ') return 'Ñ';
          return char
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .normalize('NFC');
        }).join('');
        
        // Then process digraphs
        const processed = processDigraphs(upperWord);
        
        console.log('Word validation debug:', {
          originalWord: w,
          upperWord,
          processedWord: processed,
          length: processed.length,
          trieContains: wordTrie.search(processed),
          wordsInTrie: Array.from(wordTrie.getWordsStartingWith(processed)),
          allWords: Array.from(wordTrie.getAllWords()).slice(0, 10) // Show first 10 words for debugging
        });
        
        return processed;
      });
      
      const isValid = processedWords.every(w => {
        if (!w) return false;
        const result = wordTrie.search(w);
        return result;
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

  const handleWordChange = (newWord: string) => {
    setWord(newWord);
    if (result.checked) {
      setResult({ ...result, checked: false });
    }
  };

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