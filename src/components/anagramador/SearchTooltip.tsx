
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface SearchTooltipProps {
  isPatternMode: boolean;
  children: React.ReactNode;
}

export const SearchTooltip = ({ isPatternMode, children }: SearchTooltipProps) => {
  return (
    <div className="relative flex-1">
      {isPatternMode ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {children}
            </TooltipTrigger>
            <TooltipContent side="top" className="w-80 p-2 text-sm">
              <p className="mb-1 font-medium">Patrones de búsqueda:</p>
              <ul className="space-y-1 text-xs">
                <li><code>-AR</code>: palabras que <b>terminan</b> con "AR"</li>
                <li><code>CO-</code>: palabras que <b>empiezan</b> con "CO"</li>
                <li><code>-CI-</code>: palabras que <b>contienen</b> "CI" (en el medio, no al inicio ni al final)</li>
                <li><code>?</code>: una letra cualquiera</li>
                <li><code>-AR/6</code>: palabras de <b>exactamente 6 letras</b> que terminan con "AR"</li>
              </ul>
              <p className="mt-1 text-xs text-gray-500">Por defecto muestra palabras de hasta 8 letras. Usa el interruptor para ver palabras más largas, o agrega <code>/N</code> para filtrar por longitud exacta.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        children
      )}
    </div>
  );
};
