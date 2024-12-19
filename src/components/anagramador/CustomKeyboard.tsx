import { useEffect, useRef, useState } from "react";
import KeyboardRow from "./keyboard/KeyboardRow";
import BackspaceButton from "./keyboard/BackspaceButton";
import BottomRow from "./keyboard/BottomRow";

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

  const DEBOUNCE_TIME = 50;
  const LONG_PRESS_DELAY = 500;
  const REPEAT_INTERVAL = 50;
  const VIBRATION_DURATION = 15;

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
    if (now - lastKeyPressTime.current < DEBOUNCE_TIME) return;
    lastKeyPressTime.current = now;

    try {
      navigator.vibrate?.(VIBRATION_DURATION);
    } catch (error) {
      console.log("Vibration not supported");
    }

    setPressedKey(key);
    onKeyPress(key);

    setTimeout(() => {
      setPressedKey(null);
    }, 100);
  };

  const startBackspaceLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    handleKeyPress("Backspace");
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      onClear();
      try {
        navigator.vibrate?.(VIBRATION_DURATION * 2);
      } catch (error) {
        console.log("Vibration not supported");
      }
    }, LONG_PRESS_DELAY);

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

  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 shadow-lg md:hidden" data-custom-keyboard>
      <div className="space-y-2 pb-safe">
        <KeyboardRow keys={row1} onKeyPress={handleKeyPress} pressedKey={pressedKey} />
        <KeyboardRow keys={row2} onKeyPress={handleKeyPress} pressedKey={pressedKey} />
        
        <div className="flex justify-center gap-1">
          <KeyboardRow keys={row3} onKeyPress={handleKeyPress} pressedKey={pressedKey} />
          <BackspaceButton
            onTouchStart={startBackspaceLongPress}
            onTouchEnd={stopBackspaceLongPress}
            onTouchCancel={stopBackspaceLongPress}
            onMouseDown={startBackspaceLongPress}
            onMouseUp={stopBackspaceLongPress}
            onMouseLeave={stopBackspaceLongPress}
            isPressed={pressedKey === "Backspace"}
          />
        </div>

        <BottomRow
          onToggle={onToggle}
          showKeyboard={showKeyboard}
          onKeyPress={handleKeyPress}
          pressedKey={pressedKey}
        />
      </div>
    </div>
  );
};

export default CustomKeyboard;