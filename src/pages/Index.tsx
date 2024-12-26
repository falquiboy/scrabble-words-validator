import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import ModuleSelector from "@/components/ModuleSelector";
import { useWordTrie } from "@/hooks/useWordTrie";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');
  const { isLoading, error, trie } = useWordTrie();

  return (
    <div className={`fixed inset-0 bg-gray-50 flex flex-col items-center`}>
      <ModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1">
        {activeModule === 'judge' ? 
          <WordValidator isLoading={isLoading} error={error} onValidate={(word: string) => {}} /> : 
          <Anagramador trie={trie} isLoading={isLoading} error={error} />}
      </div>
    </div>
  );
};

export default Index;