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

  // Highlight the letter that corresponds to the wildcard position
  const highlightWildcardLetter = (word: string, originalWord: string) => {
    const digraphs = ['CH', 'LL', 'RR'];
    let result = word;
    
    // First, find the position of the wildcard in the original word
    const wildcardIndex = originalWord.indexOf('*');
    
    if (wildcardIndex !== -1) {
      // Create arrays of letters for comparison
      const originalLetters = originalWord.replace('*', '').split('');
      const wordLetters = word.split('');
      
      // Find which letter in the word corresponds to the wildcard
      let wildcardLetter = '';
      let wildcardPosition = -1;
      
      // Create a copy of wordLetters to mark used letters
      let remainingWordLetters = [...wordLetters];
      
      // First, mark all letters that match the original word (excluding wildcard)
      originalLetters.forEach(letter => {
        const index = remainingWordLetters.indexOf(letter);
        if (index !== -1) {
          remainingWordLetters[index] = '#'; // Mark as used
        }
      });
      
      // The first non-marked letter is our wildcard match
      wildcardPosition = remainingWordLetters.findIndex(letter => letter !== '#');
      
      if (wildcardPosition !== -1) {
        // Check if this letter is part of a digraph
        const possibleDigraph = word.substr(wildcardPosition, 2);
        if (digraphs.includes(possibleDigraph)) {
          // Wrap both letters of the digraph
          result = word.slice(0, wildcardPosition) + 
                  `<span class="font-bold text-blue-500">${possibleDigraph}</span>` + 
                  word.slice(wildcardPosition + 2);
        } else {
          // Wrap single letter
          result = word.slice(0, wildcardPosition) + 
                  `<span class="font-bold text-blue-500">${word[wildcardPosition]}</span>` + 
                  word.slice(wildcardPosition + 1);
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
        results={{
          exactMatches: results?.exactMatches || [],
          wildcardMatches: results?.wildcardMatches || [],
          additionalWildcardMatches: results?.additionalWildcardMatches || []
        }}
        highlightWildcardLetter={highlightWildcardLetter}
      />
    </div>
  );
};

export default Anagramador;