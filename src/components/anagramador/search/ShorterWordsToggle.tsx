import { Switch } from "@/components/ui/switch";

interface ShorterWordsToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ShorterWordsToggle = ({ checked, onCheckedChange, disabled = false }: ShorterWordsToggleProps) => {
  return (
    <div className={`flex items-center space-x-2 ${disabled ? 'opacity-50' : ''}`}>
      <Switch
        id="show-shorter"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <label
        htmlFor="show-shorter"
        className={`text-sm text-gray-600 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        Mostrar solo palabras más cortas
      </label>
    </div>
  );
};

export default ShorterWordsToggle;