import { RefObject } from 'react';

interface KeyboardHandlerProps {
  inputRef: RefObject<HTMLInputElement>;
  word: string;
  cursorPosition: number | null;
  onWordChange: (value: string) => void;
  onValidate: () => void;
  setCursorPosition: (position: number | null) => void;
}

const KeyboardHandler = ({
  inputRef,
  word,
  cursorPosition,
  onWordChange,
  onValidate,
  setCursorPosition
}: KeyboardHandlerProps) => {
  const handleCustomKeyPress = (key: string) => {
    const input = inputRef.current;
    if (!input) return;

    if (key === "Enter") {
      onValidate();
      return;
    }

    const currentValue = word;
    const pos = cursorPosition !== null ? cursorPosition : currentValue.length;

    if (key === "Backspace") {
      if (pos > 0) {
        const newValue = currentValue.slice(0, pos - 1) + currentValue.slice(pos);
        onWordChange(newValue);
        
        const newPos = pos - 1;
        setCursorPosition(newPos);
        
        requestAnimationFrame(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(newPos, newPos);
          }
        });
      }
      return;
    }

    const newValue = currentValue.slice(0, pos) + key + currentValue.slice(pos);
    const validValue = newValue.replace(/[^A-ZÑa-zñ\s]/g, '').toUpperCase();
    onWordChange(validValue);
    
    const newPos = pos + 1;
    setCursorPosition(newPos);
    
    requestAnimationFrame(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(newPos, newPos);
      }
    });
  };

  return { handleCustomKeyPress };
};

export default KeyboardHandler;