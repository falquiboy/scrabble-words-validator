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
  activeModule: 'judge' | 'anagram';
  onModuleChange: (module: 'judge' | 'anagram') => void;
}

const NewModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  const { toast } = useToast();

  const showHelp = () => {
    toast({
      title: activeModule === 'anagram' ? "Modo patrón" : "Búsqueda",
      description: (
        <div className="mt-2 space-y-2">
          {activeModule === 'anagram' ? (
            <>
              <p>Busca palabras usando patrones:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li><strong>?</strong> - una letra cualquiera</li>
                <li><strong>^</strong> - inicio de palabra</li>
                <li><strong>$</strong> - fin de palabra</li>
                <li>Opcionalmente, después de una coma, ingresa las fichas disponibles (máx. {MAX_RACK_LETTERS})</li>
                <li><strong>*</strong> - en las fichas, representa cualquier letra</li>
              </ul>
              <p className="mt-2">Ejemplos:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>"C?SA" - palabras como CASA, COSA (cualquier letra)</li>
                <li>"^PAT" - palabras que empiezan con PAT</li>
                <li>"INA$" - palabras que terminan en INA</li>
                <li>"^PAT$" - exactamente la palabra PAT</li>
                <li>"C?SA,CASA" - palabras como CASA, COSA usando las letras CASA</li>
              </ul>
            </>
          ) : (
            <>
              <p>Puedes buscar de tres formas:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li><strong>Modo normal:</strong> Ingresa letras (máx. {MAX_RACK_LETTERS})</li>
                <li><strong>Modo patrón:</strong> Usa ?, ^ y $ para buscar patrones específicos</li>
                <li><strong>Modo natural:</strong> Escribe tu consulta en español</li>
              </ul>
              <p className="mt-2">Ejemplos en lenguaje natural:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>"palabras de 5 letras que contienen z"</li>
                <li>"palabras que empiezan con a y terminan en z"</li>
                <li>"palabras de 4 letras que empiezan con b"</li>
              </ul>
            </>
          )}
        </div>
      ),
      duration: 10000,
    });
  };

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