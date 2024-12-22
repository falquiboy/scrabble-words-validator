import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MAX_RACK_LETTERS, MAX_PATTERN_LENGTH } from "@/utils/inputValidation";

interface SearchTooltipProps {
  isPatternMode: boolean;
  children: React.ReactNode;
}

export const SearchTooltip = ({ isPatternMode, children }: SearchTooltipProps) => {
  const { toast } = useToast();

  const showHelp = () => {
    toast({
      title: isPatternMode ? "Modo patrón" : "Modo anagrama",
      description: (
        <div className="mt-2 space-y-2">
          {isPatternMode ? (
            <>
              <p>Busca palabras usando patrones:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li><strong>?</strong> - una letra cualquiera</li>
                <li><strong>-</strong> - cero o más letras</li>
                <li>Opcionalmente, después de una coma, ingresa las fichas disponibles (máx. {MAX_RACK_LETTERS})</li>
              </ul>
              <p className="mt-2">Ejemplos:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>"C?SA" - palabras como CASA, COSA (usando cualquier letra)</li>
                <li>"C?SA,CASA" - palabras como CASA, COSA usando las letras CASA</li>
                <li>"C-R,AEIOU" - palabras que empiezan con C y terminan en R usando AEIOU</li>
              </ul>
            </>
          ) : (
            <>
              <p>Busca anagramas:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Ingresa las letras disponibles (máx. {MAX_RACK_LETTERS})</li>
                <li><strong>*</strong> - comodín (cualquier letra)</li>
                <li><strong>/N</strong> - palabras de N letras (ej: CASA/4)</li>
              </ul>
              <p className="mt-2">Ejemplos:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>"CASA" - anagramas usando esas letras</li>
                <li>"CAS*" - anagramas usando un comodín</li>
                <li>"CASA/4" - palabras de 4 letras usando CASA</li>
              </ul>
            </>
          )}
        </div>
      ),
      duration: 10000,
    });
  };

  return (
    <div className="relative flex-1">
      {children}
    </div>
  );
};