import { Switch } from "@/components/ui/switch";
interface ShorterWordsToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}
const ShorterWordsToggle = ({
  checked,
  onCheckedChange
}: ShorterWordsToggleProps) => {
  return <div className="flex items-center space-x-2">
      <Switch id="show-shorter" checked={checked} onCheckedChange={onCheckedChange} />
      <label htmlFor="show-shorter" className="text-sm text-gray-600 cursor-pointer">Mostrar palabras más cortas</label>
    </div>;
};
export default ShorterWordsToggle;