import { Delete } from "lucide-react";
import KeyboardButton from "./KeyboardButton";

interface BackspaceButtonProps {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  isPressed: boolean;
}

const BackspaceButton = ({
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  isPressed
}: BackspaceButtonProps) => {
  const handleClick = () => {
    // No-op function to satisfy type requirements
  };

  return (
    <KeyboardButton
      className="w-[20%]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onClick={handleClick}
      isPressed={isPressed}
    >
      <Delete className="h-6 w-6" />
    </KeyboardButton>
  );
};

export default BackspaceButton;