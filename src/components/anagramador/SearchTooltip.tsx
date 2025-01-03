import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchTooltipProps {
  children: React.ReactNode;
  isPatternMode: boolean;
}

export const SearchTooltip = ({ children, isPatternMode }: SearchTooltipProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className="w-80 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold">
            {isPatternMode ? 'Modo patrón' : 'Modo búsqueda'}
          </h3>
          {isPatternMode ? (
            <>
              <p>Sintaxis: PATRON,ATRIL</p>
              <ul className="space-y-1 text-sm">
                <li><strong>?</strong> - letra indefinida en posición definida</li>
                <li><strong>-</strong> - al inicio/final permite extensión</li>
                <li><strong>*</strong> - en el atril, representa cualquier letra</li>
              </ul>
              <p className="text-sm mt-2">Ejemplos:</p>
              <ul className="space-y-1 text-sm">
                <li><strong>C?SA</strong> - exactamente CASA o COSA</li>
                <li><strong>-PAT</strong> - palabras que terminan en PAT</li>
                <li><strong>PAT-</strong> - palabras que empiezan con PAT</li>
                <li><strong>-PAT-</strong> - palabras que contienen PAT</li>
                <li><strong>C?SA,CASA*</strong> - usando letras CASA + comodín</li>
              </ul>
            </>
          ) : (
            <p>Usa * como comodín para representar cualquier letra</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};