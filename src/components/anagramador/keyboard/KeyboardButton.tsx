import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface KeyboardButtonProps {
  onClick: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  className?: string;
  children: ReactNode;
  variant?: "secondary" | "default" | "ghost";
  isPressed?: boolean;
}

const KeyboardButton = ({ 
  onClick, 
  onTouchStart, 
  className = "", 
  children, 
  variant = "secondary",
  isPressed = false
}: KeyboardButtonProps) => {
  const baseClasses = "h-14 text-xl font-bold transition-all bg-white border border-gray-200";
  const pressedClasses = isPressed 
    ? "transform scale-95 shadow-inner bg-gray-100" 
    : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-[1px]";

  return (
    <Button
      variant={variant}
      className={`${baseClasses} ${pressedClasses} ${className}`}
      onTouchStart={onTouchStart}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default KeyboardButton;