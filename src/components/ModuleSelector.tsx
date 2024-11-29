import { Button } from "@/components/ui/button";
import { Gavel, Shuffle } from "lucide-react";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram';
  onModuleChange: (module: 'judge' | 'anagram') => void;
}

const ModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  return (
    <div className="flex gap-2 justify-center mb-4">
      <Button
        variant={activeModule === 'judge' ? 'default' : 'outline'}
        onClick={() => onModuleChange('judge')}
        className="flex items-center gap-2"
      >
        <Gavel className="h-4 w-4" />
        Juez
      </Button>
      <Button
        variant={activeModule === 'anagram' ? 'default' : 'outline'}
        onClick={() => onModuleChange('anagram')}
        className="flex items-center gap-2"
      >
        <Shuffle className="h-4 w-4" />
        Anagramador
      </Button>
    </div>
  );
};

export default ModuleSelector;