import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagrams/SearchInput";
import ResultsList from "./anagrams/ResultsList";
import { useAnagramSearch } from "@/hooks/useAnagramSearch";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useAnagramSearch(searchTerm);

  const handleSearch = () => {
    if (letters.trim()) {
      setSearchTerm(letters);
    }
  };

  const handleClear = () => {
    setLetters("");
    setSearchTerm("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md">
      <SearchInput
        letters={letters}
        isLoading={isLoading}
        onLettersChange={setLetters}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      <ResultsList
        isLoading={isLoading}
        searchTerm={searchTerm}
        results={results}
      />
    </div>
  );
};

export default Anagramador;