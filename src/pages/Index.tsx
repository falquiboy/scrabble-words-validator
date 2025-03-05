
import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import Lists from "@/components/Lists";
import NewModuleSelector from "@/components/NewModuleSelector";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";
import { useSplashScreen } from "@/hooks/useSplashScreen";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram' | 'lists'>('judge');
  
  // Initialize dictionary at the top level so it's shared between modules
  const { isLoading: isDBLoading, progress: dbProgress, loadStartTime } = useWordDatabase();
  const { isLoading: isTrieLoading, wordCount, trie, loadingProgress } = useWordTrie();
  
  const isDictionaryLoading = isDBLoading || isTrieLoading;
  const totalProgress = isTrieLoading ? 
    (dbProgress * 0.5) + (loadingProgress * 0.5) : 
    dbProgress;

  // Determine the appropriate loading message
  let loadingMessage = "Cargando diccionario...";
  if (isDBLoading && dbProgress < 100) {
    loadingMessage = "Descargando palabras...";
  } else if (isTrieLoading && loadingProgress < 100) {
    loadingMessage = "Preparando diccionario...";
  }

  // Control the splash screen visibility
  useSplashScreen({
    progress: totalProgress,
    isLoading: isDictionaryLoading,
    message: loadingMessage
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NewModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1 w-full">
        {activeModule === 'judge' ? (
          <WordValidator 
            isDictionaryLoading={isDictionaryLoading} 
            progress={totalProgress}
            trie={trie}
          />
        ) : activeModule === 'anagram' ? (
          <Anagramador trie={trie} />
        ) : (
          <Lists />
        )}
      </div>
    </div>
  );
};

export default Index;
