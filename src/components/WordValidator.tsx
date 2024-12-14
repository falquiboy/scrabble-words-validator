import { useState } from "react";
import { processDigraphs } from "@/utils/digraphs";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";
import { wordTrie } from "@/utils/trie";
import LoadingState from "./word-validator/LoadingState";
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
    if (!word.trim()) return;

    setIsLoading(true);
    try {
      const words = word.trim().split(" ");
      const processedWords = words.map(w => {
        // First convert to uppercase and process digraphs
        const upperWord = w.toUpperCase();
        const withDigraphs = processDigraphs(upperWord);
        
        // Process special characters (Ñ and accents)
        const processed = withDigraphs
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')  // Remove accents
          .replace(/[^A-ZÑÇ\s]/g, '')       // Only allow uppercase letters, Ñ, Ç and spaces
          .replace(/[KW]/g, '');            // Remove K and W as per requirements
        
        return processed;
      });
      
      // Use Trie for fast validation
      const isValid = processedWords.every(w => {
        if (!w) return false; // Skip empty strings
        console.log('Processing word for validation:', w); // Debug log
        const result = wordTrie.search(w);
        console.log('Validation result for', w, ':', result); // Debug log
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

  // Show loading state while initializing
  if (isDBLoading || isTrieLoading) {
    return <LoadingState />;
  }

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
      </div>
    </div>
  );
};

export default WordValidator;