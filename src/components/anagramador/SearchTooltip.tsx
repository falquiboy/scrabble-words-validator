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
      title: isPatternMode ? "Modo patrón" : "Búsqueda",
      description: (
        <div className="mt-2 space-y-2">
          {isPatternMode ? (
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
    <div className="relative flex-1">
      {children}
    </div>
  );
};