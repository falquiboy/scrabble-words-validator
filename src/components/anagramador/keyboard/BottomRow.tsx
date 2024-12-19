import { CornerDownLeft, KeyboardIcon } from "lucide-react";
import KeyboardButton from "./KeyboardButton";

interface BottomRowProps {
  onToggle: () => void;
  showKeyboard: boolean;
  onKeyPress: (key: string) => void;
  pressedKey: string | null;
}

const BottomRow = ({ onToggle, showKeyboard, onKeyPress, pressedKey }: BottomRowProps) => {
  return (
    <div className="flex justify-between items-center gap-1">
      <KeyboardButton
        variant="ghost"
        className="w-14"
        onClick={onToggle}
      >
        <KeyboardIcon className={`h-6 w-6 transition-transform ${showKeyboard ? 'rotate-180' : ''}`} />
      </KeyboardButton>
      
      <KeyboardButton
        className="w-[60%]"
        onClick={() => onKeyPress(" ")}
        onTouchStart={() => onKeyPress(" ")}
        isPressed={pressedKey === " "}
      >
        Espacio
      </KeyboardButton>
      
      <KeyboardButton
        variant="default"
        className="w-14"
        onClick={() => onKeyPress("Enter")}
        onTouchStart={() => onKeyPress("Enter")}
        isPressed={pressedKey === "Enter"}
      >
        <CornerDownLeft className="h-6 w-6 text-white" />
      </KeyboardButton>
    </div>
  );
};

export default BottomRow;