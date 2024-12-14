import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import ModuleSelector from "@/components/ModuleSelector";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');

  return (
    <div className="fixed inset-0 bg-[#16417C] flex flex-col items-center pt-20">
      <ModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-8">
        {activeModule === 'judge' ? <WordValidator /> : <Anagramador />}
      </div>
    </div>
  );
};

export default Index;