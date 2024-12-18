import { RefObject, useEffect } from 'react';

interface CursorManagerProps {
  inputRef: RefObject<HTMLInputElement>;
  setCursorPosition: (position: number | null) => void;
}

const CursorManager = ({ inputRef, setCursorPosition }: CursorManagerProps) => {
  const handleSelectionChange = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  };

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      const events = ['click', 'focus', 'select', 'keyup', 'touchend'];
      events.forEach(event => {
        input.addEventListener(event, handleSelectionChange);
      });

      return () => {
        events.forEach(event => {
          input.removeEventListener(event, handleSelectionChange);
        });
      };
    }
  }, [inputRef]);

  return null;
};

export default CursorManager;