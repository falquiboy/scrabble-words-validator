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

  if (isDictionaryLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {isTrieLoading ? 'Inicializando lexicón' : 'Descargando lexicón'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {isTrieLoading ? 'Construyendo índice de palabras' : 'Obteniendo palabras'}
            </p>
          </div>
          <Progress value={totalProgress} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            {Math.round(totalProgress)}%
          </p>
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