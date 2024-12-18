import { Switch } from "@/components/ui/switch";

interface ShorterWordsToggleProps {
  showShorter: boolean;
  onShowShorterChange: (checked: boolean) => void;
}

const ShorterWordsToggle = ({ showShorter, onShowShorterChange }: ShorterWordsToggleProps) => (
  <div className="flex items-center space-x-2">
    <Switch
      id="show-shorter"
      checked={showShorter}
      onCheckedChange={onShowShorterChange}
    />
    <label
      htmlFor="show-shorter"
      className="text-sm text-gray-600 cursor-pointer"
    >
      Mostrar palabras más cortas
    </label>
  </div>
);

export default ShorterWordsToggle;