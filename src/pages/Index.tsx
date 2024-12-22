import React, { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import ModuleSelector from "@/components/ModuleSelector";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');

  return (
    <div className="flex flex-col h-screen">
      <ModuleSelector activeModule={activeModule} setActiveModule={setActiveModule} />
      <div className="mt-20 flex-1">
        {activeModule === 'judge' ? <WordValidator /> : <Anagramador />}
      </div>
    </div>
  );
};

export default Index;