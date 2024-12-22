import { Button } from "@/components/ui/button";
import { Gavel, Shuffle, HelpCircle, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MAX_RACK_LETTERS } from "@/utils/inputValidation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram';
  onModuleChange: (module: 'judge' | 'anagram') => void;
}

const ModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  const { toast } = useToast();

  const showHelp = () => {
    if (activeModule === 'anagram') {
      toast({
        title: "Modo anagrama",
        description: (
          <div className="mt-2 space-y-2">
            <p>Busca anagramas:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Ingresa las letras disponibles (máx. {MAX_RACK_LETTERS})</li>
              <li><strong>asterisco</strong> - comodín (cualquier letra)</li>
              <li><strong>/N</strong> - palabras de N letras (ej: CASA/4)</li>
            </ul>
            <p className="mt-2">Ejemplos:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>"CASA" - anagramas usando esas letras</li>
              <li>"CAS*" - anagramas usando un comodín</li>
              <li>"CASA/4" - palabras de 4 letras usando CASA</li>
            </ul>
          </div>
        ),
        duration: 10000,
      });
    }
  };

  return (
    <div className="fixed top-4 left-4 flex gap-2 items-center bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onModuleChange('judge')} className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            <span>Juez</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModuleChange('anagram')} className="flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            <span>Anagramador</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {activeModule === 'anagram' && (
        <Button
          variant="ghost"
          onClick={showHelp}
          className="fixed top-4 right-4 w-8 h-8 p-0"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ModuleSelector;