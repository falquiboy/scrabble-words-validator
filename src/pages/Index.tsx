
import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import Lists from "@/components/Lists";
import NewModuleSelector from "@/components/NewModuleSelector";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram' | 'lists'>('judge');
  
  // Initialize dictionary at the top level so it's shared between modules
  const { isLoading: isDBLoading, progress: dbProgress, loadStartTime, isFirstLoad } = useWordDatabase();
  const { isLoading: isTrieLoading, trie, loadingProgress, stage: trieStage } = useWordTrie();
  
  const isDictionaryLoading = isDBLoading || isTrieLoading;
  
  // Calculate combined progress based on the current stage
  const getCombinedProgress = () => {
    if (isTrieLoading && trieStage === 'building') {
      // If we're building the trie, the DB is already loaded, so combine the progress
      // with 90% weight to DB loading and 10% to trie building
      return Math.min(90 + (loadingProgress * 0.1), 100);
    }
    
    if (isDBLoading) {
      return dbProgress.percent;
    }
    
    if (isTrieLoading) {
      return loadingProgress;
    }
    
    return 100;
  };
  
  // Determine the current stage to display
  const getCurrentStage = () => {
    if (isTrieLoading && trieStage) {
      return trieStage;
    }
    
    if (isDBLoading && dbProgress.stage) {
      return dbProgress.stage;
    }
    
    return 'complete';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NewModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1 w-full">
        {activeModule === 'judge' ? (
          <WordValidator 
            isDictionaryLoading={isDictionaryLoading} 
            progress={getCombinedProgress()}
            trie={trie}
            stage={getCurrentStage()}
            loadStartTime={loadStartTime}
            isFirstLoad={isFirstLoad}
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
