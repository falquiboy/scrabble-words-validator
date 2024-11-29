import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import ModuleSelector from "@/components/ModuleSelector";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-scrabble-wood/20 to-scrabble-wood/5 flex flex-col items-center pt-4">
      <ModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      {activeModule === 'judge' ? <WordValidator /> : <Anagramador />}
    </div>
  );
};

export default Index;