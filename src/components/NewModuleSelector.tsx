import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { MAX_RACK_LETTERS, MAX_PATTERN_LENGTH } from "@/utils/inputValidation";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram' | 'lists';
  onModuleChange: (module: 'judge' | 'anagram' | 'lists') => void;
}

const NewModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  const { toast } = useToast();

  const showHelp = () => {
    toast({
      title: getModuleTitle(),
      description: (
        <div className="mt-2 space-y-2">
          {getModuleHelp()}
        </div>
      ),
      duration: 10000,
    });
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'lists':
        return "Generador de listas";
      case 'anagram':
        return "Modo patrón";
      default:
        return "Búsqueda";
    }
  };

  const getModuleHelp = () => {
    switch (activeModule) {
      case 'lists':
        return (
          <>
            <p>Genera listas de palabras usando lenguaje natural:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>palabras de 5 letras con dos eles</li>
              <li>palabras que empiezan con a y terminan en z</li>
              <li>palabras de 4 letras que empiezan con b</li>
            </ul>
          </>
        );
      case 'anagram':
        return (
          <>
            <p>Busca palabras usando patrones:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li><strong>?</strong> - una letra cualquiera</li>
              <li><strong>^</strong> - inicio de palabra</li>
              <li><strong>$</strong> - fin de palabra</li>
              <li>Opcionalmente, después de una coma, ingresa las fichas disponibles (máx. {MAX_RACK_LETTERS})</li>
              <li><strong>*</strong> - en las fichas, representa cualquier letra</li>
            </ul>
          </>
        );
      default:
        return (
          <>
            <p>Puedes buscar de tres formas:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li><strong>Modo normal:</strong> Ingresa letras (máx. {MAX_RACK_LETTERS})</li>
              <li><strong>Modo patrón:</strong> Usa ?, ^ y $ para buscar patrones específicos</li>
              <li><strong>Modo natural:</strong> Escribe tu consulta en español</li>
            </ul>
          </>
        );
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm flex items-center px-4">
      <div className="absolute left-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={showHelp}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ayuda</p>
          </TooltipContent>
        </Tooltip>
      </div>

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
        <Button
          variant={activeModule === 'lists' ? 'default' : 'outline'}
          onClick={() => onModuleChange('lists')}
          className="w-32"
        >
          Listas
        </Button>
      </div>
    </div>
  );
};

export default NewModuleSelector;