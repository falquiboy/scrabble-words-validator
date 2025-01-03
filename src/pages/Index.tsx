import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import NewModuleSelector from "@/components/NewModuleSelector";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');
  
  // Initialize dictionary at the top level so it's shared between modules
  const { isLoading: isDBLoading, progress: dbProgress } = useWordDatabase();
  const { isLoading: isTrieLoading, wordCount, trie, loadingProgress } = useWordTrie();
  
  const isDictionaryLoading = isDBLoading || isTrieLoading;
  const totalProgress = isTrieLoading ? 
    (dbProgress * 0.5) + (loadingProgress * 0.5) : 
    dbProgress;

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center">
      <NewModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1">
        {activeModule === 'judge' ? (
          <WordValidator 
            isDictionaryLoading={isDictionaryLoading} 
            progress={totalProgress}
            trie={trie}
          />
        ) : (
          <Anagramador trie={trie} />
        )}
      </div>
    </div>
  );
};

export default Index;