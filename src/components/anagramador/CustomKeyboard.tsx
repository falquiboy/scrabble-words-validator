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

  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyPressTime = useRef<number>(0);

  // Constants
  const DEBOUNCE_TIME = 50; // Minimum time between keypresses
  const LONG_PRESS_DELAY = 500; // Time before long press activates
  const REPEAT_INTERVAL = 50; // Time between repeated actions
  const VIBRATION_DURATION = 15; // Standard vibration duration

  const cleanupTimers = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    setIsLongPressActive(false);
  };

  const handleKeyPress = (key: string) => {
    const now = Date.now();
    if (now - lastKeyPressTime.current < DEBOUNCE_TIME) {
      return; // Debounce fast keypresses
    }
    lastKeyPressTime.current = now;

    try {
      navigator.vibrate?.(VIBRATION_DURATION);
    } catch (error) {
      console.log("Vibration not supported");
    }

    setPressedKey(key);
    onKeyPress(key);

    // Reset pressed key state after animation
    setTimeout(() => {
      setPressedKey(null);
    }, 100);
  };

  const startBackspaceLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Initial backspace
    handleKeyPress("Backspace");
    
    // Set up long press timer
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      onClear();
      try {
        navigator.vibrate?.(VIBRATION_DURATION * 2);
      } catch (error) {
        console.log("Vibration not supported");
      }
    }, LONG_PRESS_DELAY);

    // Set up repeat interval
    repeatIntervalRef.current = setInterval(() => {
      if (!isLongPressActive) {
        handleKeyPress("Backspace");
      }
    }, REPEAT_INTERVAL);
  };

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

  const getButtonClasses = (key: string) => {
    const baseClasses = "h-14 w-[9.5%] text-xl font-bold transition-all bg-white border border-gray-200";
    const isPressed = pressedKey === key;
    const pressedClasses = isPressed 
      ? "transform scale-95 shadow-inner bg-gray-100" 
      : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-[1px]";
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
              onTouchStart={() => handleKeyPress(key)}
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
              onTouchStart={() => handleKeyPress(key)}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>

        {/* Third row with backspace */}
        <div className="flex justify-center gap-1">
          {row3.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className={getButtonClasses(key)}
              onTouchStart={() => handleKeyPress(key)}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </Button>
          ))}
          <Button
            variant="secondary"
            className={`h-14 w-[20%] text-xl font-bold transition-all bg-white border border-gray-200 ${
              pressedKey === "Backspace" ? "transform scale-95 shadow-inner bg-gray-100" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
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

        {/* Bottom row with space and enter */}
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
              pressedKey === " " ? "transform scale-95 shadow-inner bg-gray-100" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
            }`}
            onTouchStart={() => handleKeyPress(" ")}
            onClick={() => handleKeyPress(" ")}
          >
            Espacio
          </Button>
          <Button
            variant="default"
            className={`h-14 w-14 flex items-center justify-center ${
              pressedKey === "Enter" ? "transform scale-95 shadow-inner" : "shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]"
            } transition-all`}
            onTouchStart={() => handleKeyPress("Enter")}
            onClick={() => handleKeyPress("Enter")}
            type="button"
          >
            <CornerDownLeft className="h-6 w-6 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;