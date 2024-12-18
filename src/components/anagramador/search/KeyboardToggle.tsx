import { Button } from "@/components/ui/button";
import { KeyboardIcon } from "lucide-react";

interface KeyboardToggleProps {
  showKeyboard: boolean;
  onToggle: () => void;
}

const KeyboardToggle = ({ showKeyboard, onToggle }: KeyboardToggleProps) => (
  <Button
    onClick={onToggle}
    variant="ghost"
    className="h-14 w-14 flex items-center justify-center md:hidden"
    type="button"
  >
    <KeyboardIcon className={`h-6 w-6 transition-transform ${showKeyboard ? 'rotate-180' : ''}`} />
  </Button>
);

export default KeyboardToggle;