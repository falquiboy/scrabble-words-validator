import { Button } from "@/components/ui/button";
import { Gavel, Shuffle, Menu } from "lucide-react";
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
    </div>
  );
};

export default ModuleSelector;