import { useQuery } from "@tanstack/react-query";
import { wordDB } from "@/utils/wordDatabase";
import { wordTrie } from "@/utils/trie";
import { processDigraphs } from "@/utils/digraphs";
import { useToast } from "@/hooks/use-toast";
import { useWordDatabase } from "./useWordDatabase";

const initializeTrie = async () => {
  // Initialize database first
  await wordDB.init();
  
  // Try to load serialized trie
  const serializedTrie = await wordDB.getStoredTrie();
  
  if (serializedTrie) {
    console.log('Loading pre-built Trie from storage...');
    const startTime = performance.now();
    
    // Deserialize and use stored trie
    wordTrie.deserialize(serializedTrie);
    const wordCount = wordTrie.getAllWords().length;
    
    const endTime = performance.now();
    console.log(`Trie loaded in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    
    return { trie: wordTrie, wordCount };
  }
  
  console.log('Building Trie for the first time...');
  // Get all words from IndexedDB
  const words = await wordDB.getAllWords();
  
  if (words.length === 0) {
    console.log('No words in IndexedDB, waiting for words to be loaded...');
    return { trie: wordTrie, wordCount: 0, needsWords: true };
  }
  
  // Clear trie before rebuilding
  wordTrie.clear();
  
  // Build trie with words
  const startTime = performance.now();
  
  // Build in batches to avoid blocking the main thread
  const batchSize = 10000;
  let processedCount = 0;
  
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    batch.forEach(word => {
      const processedWord = processDigraphs(word.toUpperCase());
      wordTrie.insert(processedWord, word);
      processedCount++;
    });
    
    if ((i + batchSize) % 50000 === 0) {
      console.log(`Built Trie with ${i + batchSize} words...`);
    }
    
    // Allow other tasks to run
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  const endTime = performance.now();
  console.log(`Trie build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
  
  // Store the built trie
  console.log('Storing built Trie...');
  const serialized = wordTrie.serialize();
  await wordDB.storeTrie(serialized);
  console.log('Trie stored successfully');
  
  return { trie: wordTrie, wordCount: processedCount };
};

export const useGlobalTrie = () => {
  const { toast } = useToast();
  const { isLoading: isLoadingWords } = useWordDatabase();
  
  const { data, isLoading: isLoadingTrie, error } = useQuery({
    queryKey: ['globalTrie'],
    queryFn: initializeTrie,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !isLoadingWords, // Only run after words are loaded
    retry: (failureCount, error) => {
      // Retry if we need words and they're still loading
      if (error?.needsWords && isLoadingWords) {
        return true;
      }
      return failureCount < 3;
    },
    meta: {
      onSuccess: (data: { trie: typeof wordTrie; wordCount: number }) => {
        if (data.wordCount > 0) {
          toast({
            title: "Diccionario cargado",
            description: `${data.wordCount.toLocaleString()} palabras disponibles para búsqueda.`,
          });
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo inicializar el validador.",
        });
      }
    }
  });

  return {
    trie: data?.trie || wordTrie,
    wordCount: data?.wordCount || 0,
    isLoading: isLoadingTrie || isLoadingWords,
    error
  };
};