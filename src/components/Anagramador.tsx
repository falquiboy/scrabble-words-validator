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
    
    // Find positions of both * and ? wildcards
    const wildcardPositions = [];
    for (let i = 0; i < originalWord.length; i++) {
      if (originalWord[i] === '*' || originalWord[i] === '?') {
        wildcardPositions.push({ pos: i, type: originalWord[i] });
      }
    }
    
    if (wildcardPositions.length > 0) {
      // Create arrays of letters for comparison
      const originalLetters = originalWord.replace(/[*?]/g, '').split('');
      const wordLetters = word.split('');
      
      // Create a copy of wordLetters to mark used letters
      let remainingWordLetters = [...wordLetters];
      
      // First, mark all letters that match the original word (excluding wildcards)
      originalLetters.forEach(letter => {
        const index = remainingWordLetters.indexOf(letter);
        if (index !== -1) {
          remainingWordLetters[index] = '#'; // Mark as used
        }
      });
      
      // Find positions of wildcard matches
      let wildcardMatches = [];
      let currentPos = 0;
      
      remainingWordLetters.forEach((letter, index) => {
        if (letter !== '#') {
          // Check if this letter is part of a digraph
          const possibleDigraph = word.substr(index, 2);
          if (digraphs.includes(possibleDigraph)) {
            wildcardMatches.push({
              pos: index,
              length: 2,
              text: possibleDigraph,
              type: wildcardPositions[currentPos]?.type || '*'
            });
          } else {
            wildcardMatches.push({
              pos: index,
              length: 1,
              text: letter,
              type: wildcardPositions[currentPos]?.type || '*'
            });
          }
          currentPos++;
        }
      });

      // Apply highlights with different colors based on wildcard type
      let offset = 0;
      wildcardMatches.sort((a, b) => b.pos - a.pos).forEach(match => {
        const color = match.type === '?' ? 'text-purple-500' : 'text-blue-500';
        const before = result.slice(0, match.pos);
        const after = result.slice(match.pos + match.length);
        result = before + `<span class="font-bold ${color}">${match.text}</span>` + after;
      });
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