import { useState } from "react";
import Anagramador from "@/components/Anagramador";
import WordValidator from "@/components/WordValidator";
import ModuleSelector from "@/components/ModuleSelector";

export const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');

  return (
    <div className="h-screen overflow-hidden">
      <ModuleSelector 
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
      />
      {activeModule === 'judge' ? (
        <WordValidator />
      ) : (
        <Anagramador />
      )}
    </div>
  );
}