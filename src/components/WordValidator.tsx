import { useState } from "react";
import { processDigraphs } from "@/utils/digraphs";
import { wordTrie } from "@/utils/trie";
import Header from "./word-validator/Header";
import WordInput from "./word-validator/WordInput";
import { Progress } from "@/components/ui/progress";

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
      const processedWords = words.map(w => {
        let upperWord = w.toUpperCase();
        
        console.log('Word processing debug:', {
          step: 'initial',
          originalWord: w,
          upperWord,
          length: upperWord.length
        });
        
        upperWord = upperWord.split('').map(char => {
          if (['Ç', 'K', 'W'].includes(char)) {
            console.log('Special character found:', { char });
            return char;
          }
          if (char === 'Ñ' || char === 'ñ') {
            console.log('Ñ character found');
            return 'Ñ';
          }
          
          const normalized = char
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .normalize('NFC');
          
          console.log('Character normalization:', {
            original: char,
            normalized,
            charCode: char.charCodeAt(0)
          });
          
          return normalized;
        }).join('');
        
        const processed = processDigraphs(upperWord);
        
        console.log('Word validation debug:', {
          originalWord: w,
          upperWord,
          processedWord: processed,
          length: processed.length,
          trieContains: wordTrie.search(processed),
          wordsInTrie: Array.from(wordTrie.getWordsStartingWith(processed)).slice(0, 5),
          charCodes: Array.from(processed).map(c => c.charCodeAt(0))
        });
        
        return processed;
      });
      
      const isValid = processedWords.every(w => {
        if (!w) return false;
        const result = wordTrie.search(w);
        console.log('Word validation result:', {
          word: w,
          isValid: result,
          length: w.length,
          charCodes: Array.from(w).map(c => c.charCodeAt(0))
        });
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
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-gray-500">
              Cargando lexicón... ({((Date.now() - loadStartTime) / 1000).toFixed(1)}s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordValidator;