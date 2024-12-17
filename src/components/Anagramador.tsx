import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useGlobalTrie } from "@/hooks/useGlobalTrie";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showShorterWords, setShowShorterWords] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use global Trie
  const { isLoading: isTrieLoading } = useGlobalTrie();

  // Query for words using offline search hook
  const { data: results, isLoading: isSearchLoading } = useOfflineAnagramSearch(searchTerm);

  const handleInputChange = (value: string) => {
    // Updated regex to allow hyphens along with letters and wildcards
    const sanitizedValue = value.replace(/[^a-zA-ZÑñ*\-/.]/g, '');
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

  // Create a wrapper function to handle the HTML dangerously
  const renderHighlightedWord = (word: string, originalWord: string) => {
    const highlightedHtml = highlightWildcardLetter(word, originalWord);
    return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (isTrieLoading) {
    return <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="w-full max-w-md space-y-4 px-4">
      <SearchInput
        letters={letters}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        onClear={handleClear}
        onKeyPress={handleKeyPress}
        inputRef={inputRef}
      />
      <div className="flex items-center space-x-2">
        <Switch
          id="show-shorter"
          checked={showShorterWords}
          onCheckedChange={setShowShorterWords}
        />
        <Label htmlFor="show-shorter">Mostrar palabras más cortas</Label>
      </div>
      <ResultsList
        isLoading={isSearchLoading}
        searchTerm={searchTerm}
        results={{
          exactMatches: results?.exactMatches || [],
          wildcardMatches: results?.wildcardMatches || [],
          additionalWildcardMatches: results?.additionalWildcardMatches || [],
          patternMatches: results?.patternMatches || [],
          shorterMatches: results?.shorterMatches || new Map()
        }}
        highlightWildcardLetter={renderHighlightedWord}
        showShorterWords={showShorterWords}
      />
    </div>
  );
};

export default Anagramador;