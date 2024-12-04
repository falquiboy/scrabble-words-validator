import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useAnagramSearch } from "@/hooks/useAnagramSearch";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Query for words using custom hook
  const { data: results, isLoading } = useAnagramSearch(searchTerm);

  // Handle input changes
  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-ZÑñ*]/g, '');
    setLetters(sanitizedValue.toUpperCase());
  };

  // Handle search
  const handleSearch = () => {
    if (letters.trim()) {
      setSearchTerm(letters);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clear
  const handleClear = () => {
    setLetters("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  // Highlight only the letter that corresponds to the wildcard and any additional letters
  const highlightWildcardLetter = (word: string, originalWord: string) => {
    if (word.length <= originalWord.length) return word;
    
    const digraphs = ['CH', 'LL', 'RR'];
    let result = word;
    
    // First, find the position of the wildcard in the original word
    const wildcardIndex = originalWord.indexOf('*');
    
    if (wildcardIndex !== -1) {
      // Get all letters from the original word (excluding the wildcard)
      const originalLetters = originalWord.replace('*', '').split('');
      let remainingWord = word;
      
      // Remove all letters from the original word from remainingWord
      originalLetters.forEach(letter => {
        const index = remainingWord.indexOf(letter);
        if (index !== -1) {
          remainingWord = remainingWord.slice(0, index) + remainingWord.slice(index + 1);
        }
      });
      
      // Now remainingWord should contain only the letter that was added
      if (remainingWord) {
        const letterIndex = word.indexOf(remainingWord[0]);
        if (letterIndex !== -1) {
          // Check if this letter is part of a digraph
          const possibleDigraph = word.substr(letterIndex, 2);
          if (digraphs.includes(possibleDigraph)) {
            // Wrap both letters of the digraph
            result = word.slice(0, letterIndex) + 
                    `<span class="font-bold text-blue-500">${possibleDigraph}</span>` + 
                    word.slice(letterIndex + 2);
          } else {
            // Wrap single letter
            result = word.slice(0, letterIndex) + 
                    `<span class="font-bold text-blue-500">${remainingWord[0]}</span>` + 
                    word.slice(letterIndex + 1);
          }
        }
      }
    }

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <SearchInput
        letters={letters}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        onClear={handleClear}
        onKeyPress={handleKeyPress}
      />
      <ResultsList
        isLoading={isLoading}
        searchTerm={searchTerm}
        results={results}
        highlightWildcardLetter={highlightWildcardLetter}
      />
    </div>
  );
};

export default Anagramador;