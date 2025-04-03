
import { Switch } from "@/components/ui/switch";

interface ShorterWordsToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  isPatternMode?: boolean;
}

const ShorterWordsToggle = ({
  checked,
  onCheckedChange,
  isPatternMode = false
}: ShorterWordsToggleProps) => {
  const label = isPatternMode 
    ? "Mostrar palabras más largas (>8 letras)" 
    : "Mostrar palabras más cortas";
    
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="toggle-words" 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
      />
      <label 
        htmlFor="toggle-words" 
        className="text-sm text-gray-600 cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
};

export default ShorterWordsToggle;
