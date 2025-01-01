import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import NewModuleSelector from "@/components/NewModuleSelector";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');
  
  // Initialize dictionary at the top level so it's shared between modules
  const { isLoading: isDBLoading, progress: dbProgress } = useWordDatabase();
  const { isLoading: isTrieLoading, wordCount, trie } = useWordTrie();
  
  const isDictionaryLoading = isDBLoading || isTrieLoading;
  const totalProgress = isTrieLoading ? 
    (dbProgress * 0.5) + ((wordCount / 639293) * 50) : 
    dbProgress;

  if (isDictionaryLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Loading dictionary...</p>
          <p className="text-sm text-gray-600">{Math.round(totalProgress)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center">
      <NewModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
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