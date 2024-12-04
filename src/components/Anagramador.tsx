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

  // Clear search
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
    let offset = 0;

    // First, find the position of the wildcard in the original word
    const wildcardIndex = originalWord.indexOf('*');
    
    if (wildcardIndex !== -1) {
      // Get all letters from the original word (excluding the wildcard)
      const originalLetters = originalWord.replace('*', '').split('');
      let remainingWord = word;
      
      // Remove all letters from the original word from remainingWord
      originalLetters.forEach(letter => {
        remainingWord = remainingWord.replace(letter, '');
      });
      
      // Now remainingWord should contain only the letters that were added
      // (usually should be just one letter or one digraph)
      if (remainingWord) {
        const letterIndex = word.indexOf(remainingWord[0]);
        if (letterIndex !== -1) {
          // Check if this letter is part of a digraph
          const possibleDigraph = word.substr(letterIndex, 2);
          if (digraphs.includes(possibleDigraph)) {
            // Wrap both letters of the digraph
            const before = result.slice(0, letterIndex + offset);
            const digraph = result.slice(letterIndex + offset, letterIndex + offset + 2);
            const after = result.slice(letterIndex + offset + 2);
            result = before + `<span class="font-bold text-blue-500">${digraph}</span>` + after;
          } else {
            // Wrap single letter
            const before = result.slice(0, letterIndex + offset);
            const letter = result.slice(letterIndex + offset, letterIndex + offset + 1);
            const after = result.slice(letterIndex + offset + 1);
            result = before + `<span class="font-bold text-blue-500">${letter}</span>` + after;
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