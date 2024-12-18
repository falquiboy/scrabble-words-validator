import { Button } from "@/components/ui/button";
import { Trash2, Delete, Keyboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onToggle: () => void;
  showKeyboard: boolean;
}

const CustomKeyboard = ({ onKeyPress, onClear, onToggle, showKeyboard }: CustomKeyboardProps) => {
  const row1 = ['Q', '*', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', '?', 'L', 'Ñ'];
  const row3 = ['/', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  // State for tracking pressed keys and long press
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backspaceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for timing
  const INITIAL_DELAY = 500; // Initial delay before repeat starts
  const REPEAT_DELAY = 50;   // Delay between repeats
  const VIBRATION_DURATION = 15; // Duration of vibration in milliseconds

  // Handle key press with vibration
  const handleKeyPress = (key: string) => {
    // Attempt to vibrate
    try {
      if (navigator.vibrate) {
        navigator.vibrate(VIBRATION_DURATION);
      }
    } catch (error) {
      console.log("Vibration not supported");
    }

    setPressedKey(key);
    onKeyPress(key);

    // Reset pressed key after animation duration
    setTimeout(() => {
      setPressedKey(null);
    }, 100);
  };

  // Handle backspace long press
  const startBackspaceTimer = () => {
    if (backspaceTimerRef.current) return;

    // Initial backspace
    handleKeyPress("Backspace");

    // Set up long press timer
    backspaceTimerRef.current = setTimeout(() => {
      // Start continuous backspace
      backspaceIntervalRef.current = setInterval(() => {
        handleKeyPress("Backspace");
      }, REPEAT_DELAY);
    }, INITIAL_DELAY);
  };

  const stopBackspaceTimer = () => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
    if (backspaceIntervalRef.current) {
      clearInterval(backspaceIntervalRef.current);
      backspaceIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackspaceTimer();
    };
  }, []);

  // Helper function to get dynamic button classes
  const getButtonClasses = (key: string) => {
    const baseClasses = "h-14 w-[9.5%] text-xl font-bold transition-all bg-white border border-gray-200";
    const pressedClasses = pressedKey === key ? "bg-gray-200 transform scale-95" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-[1px]";
    return `${baseClasses} ${pressedClasses}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 shadow-lg md:hidden" data-custom-keyboard>
      <div className="space-y-2 pb-safe">
        {/* First row */}
        <div className="flex justify-center gap-1">
          {row1.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className={getButtonClasses(key)}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
        {/* Second row */}
        <div className="flex justify-center gap-1">
          {row2.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className={getButtonClasses(key)}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
        {/* Third row with backspace button */}
        <div className="flex justify-center gap-1">
          {row3.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className={getButtonClasses(key)}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </Button>
          ))}
          <Button
            variant="secondary"
            className={`h-14 w-[20%] text-xl font-bold transition-all bg-white border border-gray-200 ${
              pressedKey === "Backspace" ? "bg-gray-200 transform scale-95" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onMouseDown={startBackspaceTimer}
            onMouseUp={stopBackspaceTimer}
            onMouseLeave={stopBackspaceTimer}
            onTouchStart={startBackspaceTimer}
            onTouchEnd={stopBackspaceTimer}
          >
            <Delete className="h-6 w-6" />
          </Button>
        </div>
        {/* Bottom row with centered space bar */}
        <div className="flex justify-between items-center gap-1">
          <Button
            onClick={onClear}
            variant="destructive"
            className="h-14 w-14 flex items-center justify-center shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-[1px] transition-all"
          >
            <Trash2 className="h-6 w-6 text-white" />
          </Button>
          <Button
            variant="secondary"
            className={`h-14 w-[60%] text-lg font-bold transition-all bg-white border border-gray-200 ${
              pressedKey === " " ? "bg-gray-200 transform scale-95" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onClick={() => handleKeyPress(" ")}
          >
            Espacio
          </Button>
          <Button
            onClick={onToggle}
            variant="ghost"
            className="h-14 w-14 flex items-center justify-center md:hidden"
            type="button"
          >
            <Keyboard className={`h-6 w-6 transition-transform ${showKeyboard ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;