import { useState, useEffect, useRef } from "react";
import SearchInput from "./anagramador/SearchInput";
import ResultsList from "./anagramador/ResultsList";
import { useOfflineAnagramSearch } from "@/hooks/useOfflineAnagramSearch";
import { highlightWildcardLetter } from "@/utils/wildcardHighlighting";
import { useGlobalTrie } from "@/hooks/useGlobalTrie";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { wordDB } from "@/utils/wordDatabase";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use global Trie
  const { isLoading: isTrieLoading } = useGlobalTrie();

  // Query for words using offline search hook
  const { data: results, isLoading: isSearchLoading } = useOfflineAnagramSearch(searchTerm);

  const handleInputChange = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-ZÑñ*/.]/g, '');
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

  // Handle cache clear
  const handleClearCache = async () => {
    try {
      await wordDB.clear();
      toast({
        title: "Cache limpiado",
        description: "La caché se ha limpiado correctamente. Recarga la página para reconstruir.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo limpiar la caché.",
      });
    }
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
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          className="text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Limpiar caché
        </Button>
      </div>
      <SearchInput
        letters={letters}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        onClear={handleClear}
        onKeyPress={handleKeyPress}
        inputRef={inputRef}
      />
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
      />
    </div>
  );
};

export default Anagramador;