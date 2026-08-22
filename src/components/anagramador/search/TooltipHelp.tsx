
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TooltipHelpProps {
  isPatternMode: boolean;
}

const TooltipHelp = ({
  isPatternMode
}: TooltipHelpProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex shrink-0 items-center justify-center w-10 h-12 text-gray-500 hover:text-gray-700" aria-label="Ayuda del anagramador">
          <HelpCircle className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 text-sm" align="end">
        <p className="mb-2 font-medium">{isPatternMode ? 'Ayuda del patrón' : 'Ayuda del anagramador'}</p>
        <ul className="space-y-1 text-xs">
          <li><code>CASERON</code>: anagramas del atril</li>
          <li><code>EOCRNS?</code>: <code>?</code> es un comodín del atril</li>
          <li><code>CO*</code>, <code>*AR</code>, <code>*CI*</code>: empieza, termina o contiene</li>
          <li><code>.</code>: exactamente una letra; <code>*</code>: cero o más</li>
          <li><code>@</code>: una vocal; <code>&amp;</code>: una consonante</li>
          <li><code>+ABC</code>: exige A, B y C; <code>-ABC</code>: las excluye</li>
          <li><code>+4@</code>: al menos 4 vocales</li>
          <li><code>:4</code>: todas las palabras de 4 fichas</li>
          <li><code>.R.Z*,AEEBRS:5</code>: patrón, atril y longitud</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">Usa sólo <code>:N</code> para listar esa extensión, o agrégalo al final de otra consulta.</p>
        <a href="/support" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 hover:underline">Ver la ayuda completa</a>
      </PopoverContent>
    </Popover>
  );
};

export default TooltipHelp;
