import { Switch } from "@/components/ui/switch";

interface SearchModesProps {
  isPatternMode: boolean;
  onPatternModeChange: (checked: boolean) => void;
}

export const SearchModes = ({
  isPatternMode,
  onPatternModeChange,
}: SearchModesProps) => {
  return (
    <div className="flex items-center space-x-4 mb-2">
      <div className="flex items-center space-x-2">
        <Switch
          id="pattern-mode"
          checked={isPatternMode}
          onCheckedChange={onPatternModeChange}
        />
        <label
          htmlFor="pattern-mode"
          className="text-sm text-gray-600 cursor-pointer"
        >
          Modo patrón
        </label>
      </div>
    </div>
  );
};