import React, { Dispatch, SetStateAction } from 'react';
import { useToast } from "@/hooks/use-toast";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram';
  setActiveModule: Dispatch<SetStateAction<'judge' | 'anagram'>>;
}

const ModuleSelector = ({ activeModule, setActiveModule }: ModuleSelectorProps) => {
  const { toast } = useToast();

  const handleModuleChange = () => {
    const newModule = activeModule === 'judge' ? 'anagram' : 'judge';
    setActiveModule(newModule);
  };

  return (
    <div className="flex justify-between p-4">
      <button
        onClick={handleModuleChange}
        className={`p-2 ${activeModule === 'judge' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        Judge
      </button>
      <button
        onClick={handleModuleChange}
        className={`p-2 ${activeModule === 'anagram' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        Anagram
      </button>
    </div>
  );
};

export default ModuleSelector;
