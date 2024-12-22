import { Button } from "@/components/ui/button";
import { Gavel, Shuffle, Menu, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

interface ModuleSelectorProps {
  activeModule: 'judge' | 'anagram';
  onModuleChange: (module: 'judge' | 'anagram') => void;
}

const ModuleSelector = ({ activeModule, onModuleChange }: ModuleSelectorProps) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if user has a theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="fixed top-4 right-4 flex gap-2 items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {theme === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
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