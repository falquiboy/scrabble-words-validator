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
      const processedWords = words.map(w => processDigraphs(w));
      
      // Use Trie for fast validation
      const isValid = processedWords.every(w => wordTrie.search(w));
      
      setResult({ 
        isValid, 
        checked: true, 
        words: words.map(w => w.toUpperCase()) 
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
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