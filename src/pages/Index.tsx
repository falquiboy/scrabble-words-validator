import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import ModuleSelector from "@/components/ModuleSelector";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');
  
  // Initialize dictionary at the top level so it's shared between modules
  const { isLoading: isDBLoading, progress: dbProgress } = useWordDatabase();
  const { isLoading: isTrieLoading, wordCount } = useWordTrie();
  
  const isDictionaryLoading = isDBLoading || isTrieLoading;
  const totalProgress = isTrieLoading ? 
    (dbProgress * 0.5) + ((wordCount / 639293) * 50) : 
    dbProgress;

  return (
    <div className={`fixed inset-0 bg-gray-50 flex flex-col items-center`}>
      <ModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1">
        {activeModule === 'judge' ? (
          <WordValidator 
            isDictionaryLoading={isDictionaryLoading} 
            progress={totalProgress}
          />
        ) : (
          <Anagramador trie={trie} />
        )}
      </div>
    </div>
  );
};

export default Index;