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
    // Allow letters, *, and ? wildcards
    const sanitizedValue = value.replace(/[^a-zA-ZÑñ*?]/g, '');
    setLetters(sanitizedValue.toUpperCase());
  };

  // Handle search
  const handleSearch = () => {
    console.log('Search triggered with letters:', letters);
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
    
    // Find positions of wildcards
    const wildcardPositions = originalWord.split('').map((char, index) => {
      if (char === '*' || char === '?') {
        return { pos: index, type: char };
      }
      return null;
    }).filter(Boolean);
    
    if (wildcardPositions.length > 0) {
      // Create arrays of letters for comparison
      const originalLetters = originalWord.replace(/[*?]/g, '').split('');
      const wordLetters = word.split('');
      
      // For ? wildcards, we need to match the exact position
      const questionMarkPositions = wildcardPositions
        .filter(wp => wp?.type === '?')
        .map(wp => wp?.pos);
      
      // For each question mark position, highlight the corresponding letter
      questionMarkPositions.forEach(pos => {
        if (pos !== undefined && pos < word.length) {
          const color = 'text-purple-500';
          const letter = wordLetters[pos];
          // Check if it's part of a digraph
          const possibleDigraph = pos < word.length - 1 ? word.substr(pos, 2) : '';
          if (digraphs.includes(possibleDigraph)) {
            result = result.slice(0, pos) + 
                    `<span class="font-bold ${color}">${possibleDigraph}</span>` + 
                    result.slice(pos + 2);
          } else {
            result = result.slice(0, pos) + 
                    `<span class="font-bold ${color}">${letter}</span>` + 
                    result.slice(pos + 1);
          }
        }
      });
      
      // Handle * wildcards
      const starPositions = wildcardPositions
        .filter(wp => wp?.type === '*')
        .map(wp => wp?.pos);
      
      if (starPositions.length > 0) {
        // Find letters that haven't been matched yet
        const remainingLetters = word.split('').map((letter, index) => {
          if (!result.includes(`<span class="font-bold text-purple-500">${letter}</span>`)) {
            return { letter, index };
          }
          return null;
        }).filter(Boolean);
        
        // Highlight remaining unmatched letters in blue
        remainingLetters.forEach(item => {
          if (item && !originalLetters.includes(item.letter)) {
            const color = 'text-blue-500';
            result = result.slice(0, item.index) + 
                    `<span class="font-bold ${color}">${item.letter}</span>` + 
                    result.slice(item.index + 1);
          }
        });
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