import { Button } from "@/components/ui/button";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram';
  onModuleChange: (module: 'judge' | 'anagram') => void;
}

const ModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-center space-x-4 px-4">
      <Button
        variant={activeModule === 'judge' ? 'default' : 'outline'}
        onClick={() => onModuleChange('judge')}
        className="w-32"
      >
        Juez
      </Button>
      <Button
        variant={activeModule === 'anagram' ? 'default' : 'outline'}
        onClick={() => onModuleChange('anagram')}
        className="w-32"
      >
        Anagramador
      </Button>
    </div>
  );
};

export default ModuleSelector;