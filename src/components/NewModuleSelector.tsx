
import React from "react";
import { Button } from "@/components/ui/button";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram' | 'lists';
  onModuleChange: (module: 'judge' | 'anagram' | 'lists') => void;
}

const NewModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm flex items-center px-2 sm:px-4">
      <div className="flex gap-2 sm:gap-4 mx-auto">
        <Button
          variant={activeModule === 'judge' ? 'default' : 'outline'}
          onClick={() => onModuleChange('judge')}
          className="w-24 sm:w-32 text-sm sm:text-base"
        >
          Juez
        </Button>
        <Button
          variant={activeModule === 'anagram' ? 'default' : 'outline'}
          onClick={() => onModuleChange('anagram')}
          className="w-24 sm:w-32 text-sm sm:text-base"
        >
          Anagramador
        </Button>
        <Button
          variant={activeModule === 'lists' ? 'default' : 'outline'}
          onClick={() => onModuleChange('lists')}
          className="w-24 sm:w-32 text-sm sm:text-base"
        >
          Listas
        </Button>
      </div>
    </div>
  );
};

export default NewModuleSelector;
