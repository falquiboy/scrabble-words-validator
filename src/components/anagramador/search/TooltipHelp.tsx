
import { Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface TooltipHelpProps {
  isPatternMode: boolean;
}

const TooltipHelp = ({ isPatternMode }: TooltipHelpProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mt-1">
          <Info className="h-4 w-4" />
          <span className="text-xs">Ayuda</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-2 text-sm">
        <p className="mb-1 font-medium">Patrones de búsqueda:</p>
        <ul className="space-y-1 text-xs">
          <li><code>-AR</code>: palabras que <b>terminan</b> con "AR"</li>
          <li><code>CO-</code>: palabras que <b>empiezan</b> con "CO"</li>
          <li><code>-CI-</code>: palabras que <b>contienen</b> "CI" (en el medio)</li>
          <li><code>?</code>: una letra cualquiera</li>
          <li><code>-AR:6</code>: palabras de <b>exactamente 6 letras</b> que terminan con "AR"</li>
          <li><code>C??A,LETRA</code>: <b>patrones + fichas</b> - usar las letras "LETRA" para completar el patrón "C??A"</li>
        </ul>
        <p className="mt-1 text-xs text-gray-500">Por defecto muestra palabras de hasta 8 letras. Usa el interruptor para ver palabras más largas, o agrega <code>:N</code> para filtrar por longitud exacta.</p>
      </HoverCardContent>
    </HoverCard>
  );
};

export default TooltipHelp;
