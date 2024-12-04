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

  // Highlight both wildcard and additional letters
  const highlightWildcardLetter = (word: string, originalWord: string) => {
    if (word.length <= originalWord.length) return word;
    
    const wordLetters = word.split('');
    const originalLetters = originalWord.split('');
    let remainingOriginal = [...originalLetters];
    let extraLetters: string[] = [];
    
    // Find letters in word that aren't in original
    wordLetters.forEach((letter) => {
      const matchIndex = remainingOriginal.indexOf(letter);
      if (matchIndex === -1) {
        extraLetters.push(letter);
      } else {
        remainingOriginal.splice(matchIndex, 1);
      }
    });

    // Handle digraphs (CH, LL, RR)
    const digraphs = ['CH', 'LL', 'RR'];
    let result = word;
    let offset = 0;

    extraLetters.forEach(letter => {
      const letterIndex = word.indexOf(letter);
      if (letterIndex !== -1) {
        // Check if this letter is part of a digraph
        const possibleDigraph = word.substr(letterIndex, 2);
        if (digraphs.includes(possibleDigraph)) {
          // Wrap both letters of the digraph
          const before = result.slice(0, letterIndex + offset);
          const digraph = result.slice(letterIndex + offset, letterIndex + offset + 2);
          const after = result.slice(letterIndex + offset + 2);
          result = before + `<span class="font-bold text-blue-500">${digraph}</span>` + after;
          offset += 47; // Length of the span tags and classes
        } else {
          // Wrap single letter
          const before = result.slice(0, letterIndex + offset);
          const letter = result.slice(letterIndex + offset, letterIndex + offset + 1);
          const after = result.slice(letterIndex + offset + 1);
          result = before + `<span class="font-bold text-blue-500">${letter}</span>` + after;
          offset += 46; // Length of the span tags and classes
        }
      }
    });

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