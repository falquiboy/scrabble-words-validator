import { useState } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import ModuleSelector from "@/components/ModuleSelector";
import WordCount from "@/components/WordCount";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');

  return (
    <div className={`fixed inset-0 bg-gray-50 flex flex-col items-center`}>
      <ModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1">
        {activeModule === 'judge' ? <WordValidator /> : <Anagramador />}
      </div>
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <WordCount />
      </div>
    </div>
  );
};

export default Index;