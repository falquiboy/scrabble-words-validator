import { useState } from "react";
import { processDigraphs, toDisplayFormat } from "@/utils/digraphs";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";
import { wordTrie } from "@/utils/trie";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";

const WordValidator = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    checked: boolean;
    words: string[];
  }>({ isValid: false, checked: false, words: [] });
  const [isEditing, setIsEditing] = useState(false);

  // Initialize both IndexedDB and Trie
  const { isLoading: isDBLoading } = useWordDatabase();
  const { isLoading: isTrieLoading } = useWordTrie();

  const handleValidate = async () => {
    if (!word.trim() || isDBLoading || isTrieLoading) return;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const processedWords = words.map(w => {
        // First convert to uppercase and preserve Ñ
        let upperWord = w.toUpperCase();
        
        // Special handling for Ñ - preserve it exactly as is
        upperWord = upperWord.split('').map(char => {
          if (char === 'Ñ' || char === 'ñ') return 'Ñ';
          // For non-Ñ characters, remove accents
          return char
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .normalize('NFC');
        }).join('');
        
        // Process digraphs (CH -> Ç, LL -> K, RR -> W)
        const processed = processDigraphs(upperWord);
        
        // Log lengths - after processing digraphs since we want to count them as single letters
        console.log('Original word:', upperWord);
        console.log('Processed word:', processed, 'length:', processed.length);
        
        // Log the actual Trie content for debugging
        console.log('Words in Trie containing this word:', 
          Array.from(wordTrie.getWordsStartingWith(processed))
        );
        
        return processed;
      });
      
      // Use Trie for fast validation
      const isValid = processedWords.every(w => {
        if (!w) return false; // Skip empty strings
        console.log('Processing word for validation:', w);
        const result = wordTrie.search(w);
        console.log('Validation result for', w, ':', result);
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
        {(isDBLoading || isTrieLoading) && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Cargando diccionario...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordValidator;