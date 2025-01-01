import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram';
  onModuleChange: (module: 'judge' | 'anagram') => void;
}

const NewModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm flex items-center px-4">
      {/* Help button in the upper left corner */}
      <div className="absolute left-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={() => window.open('https://github.com/dmarman/lxs/wiki/Ayuda', '_blank')}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ayuda</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Module selector buttons in the center */}
      <div className="flex gap-4 mx-auto">
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
    </div>
  );
};

export default NewModuleSelector;