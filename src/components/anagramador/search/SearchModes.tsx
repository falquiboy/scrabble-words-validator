import { Switch } from "@/components/ui/switch";

interface SearchModesProps {
  isPatternMode: boolean;
  isNaturalMode: boolean;
  onPatternModeChange: (checked: boolean) => void;
  onNaturalModeChange: (checked: boolean) => void;
}

export const SearchModes = ({
  isPatternMode,
  isNaturalMode,
  onPatternModeChange,
  onNaturalModeChange,
}: SearchModesProps) => {
  return (
    <div className="flex items-center space-x-4 mb-2">
      <div className="flex items-center space-x-2">
        <Switch
          id="pattern-mode"
          checked={isPatternMode}
          onCheckedChange={(checked) => {
            onPatternModeChange(checked);
            if (checked) onNaturalModeChange(false);
          }}
        />
        <label
          htmlFor="pattern-mode"
          className="text-sm text-gray-600 cursor-pointer"
        >
          Modo patrón
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="natural-mode"
          checked={isNaturalMode}
          onCheckedChange={(checked) => {
            onNaturalModeChange(checked);
            if (checked) onPatternModeChange(false);
          }}
        />
        <label
          htmlFor="natural-mode"
          className="text-sm text-gray-600 cursor-pointer"
        >
          Modo natural
        </label>
      </div>
    </div>
  );
};