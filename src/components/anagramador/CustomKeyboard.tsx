import { Button } from "@/components/ui/button";
import { CornerDownLeft, Delete, KeyboardIcon } from "lucide-react";
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
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);

  // Constants for timing
  const INITIAL_DELAY = 500;  // Initial delay before repeat starts
  const REPEAT_INTERVAL = 50; // Interval between repeats
  const VIBRATION_DURATION = 15;

  // Cleanup function for timers
  const cleanupTimers = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    isLongPressActiveRef.current = false;
  };

  // Handle regular key press with vibration
  const handleKeyPress = (key: string) => {
    try {
      navigator.vibrate?.(VIBRATION_DURATION);
    } catch (error) {
      console.log("Vibration not supported");
    }

    setPressedKey(key);
    onKeyPress(key);

    setTimeout(() => {
      setPressedKey(null);
    }, 150);
  };

  // Start backspace long press
  const startBackspaceLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Initial backspace press
    handleKeyPress("Backspace");
    
    // Set up long press timer for clear functionality
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      onClear(); // Clear all text when long pressed
      try {
        navigator.vibrate?.(100); // Longer vibration for clear
      } catch (error) {
        console.log("Vibration not supported");
      }
    }, INITIAL_DELAY);

    // Set up repeat interval for backspace
    repeatIntervalRef.current = setInterval(() => {
      if (!isLongPressActiveRef.current) {
        handleKeyPress("Backspace");
      }
    }, REPEAT_INTERVAL);
  };

  // Stop backspace long press
  const stopBackspaceLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cleanupTimers();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  // Helper function to get dynamic button classes
  const getButtonClasses = (key: string) => {
    const baseClasses = "h-14 w-[9.5%] text-xl font-bold transition-all bg-white border border-gray-200";
    const pressedClasses = pressedKey === key ? "animate-key-press transform scale-95" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-[1px]";
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
              pressedKey === "Backspace" ? "animate-key-press transform scale-95" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onTouchStart={startBackspaceLongPress}
            onTouchEnd={stopBackspaceLongPress}
            onTouchCancel={stopBackspaceLongPress}
            onMouseDown={startBackspaceLongPress}
            onMouseUp={stopBackspaceLongPress}
            onMouseLeave={stopBackspaceLongPress}
            onClick={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <Delete className="h-6 w-6" />
          </Button>
        </div>
        {/* Bottom row with centered space bar */}
        <div className="flex justify-between items-center gap-1">
          <Button
            onClick={onToggle}
            variant="ghost"
            className="h-14 w-14 flex items-center justify-center md:hidden"
            type="button"
          >
            <KeyboardIcon className={`h-6 w-6 transition-transform ${showKeyboard ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="secondary"
            className={`h-14 w-[60%] text-lg font-bold transition-all bg-white border border-gray-200 ${
              pressedKey === " " ? "animate-key-press transform scale-95" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onClick={() => handleKeyPress(" ")}
          >
            Espacio
          </Button>
          <Button
            onClick={() => handleKeyPress("Enter")}
            variant="default"
            className="h-14 w-14 flex items-center justify-center shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-[1px] transition-all"
          >
            <CornerDownLeft className="h-6 w-6 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;