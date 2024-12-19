import KeyboardButton from "./KeyboardButton";

interface KeyboardRowProps {
  keys: string[];
  onKeyPress: (key: string) => void;
  pressedKey: string | null;
}

const KeyboardRow = ({ keys, onKeyPress, pressedKey }: KeyboardRowProps) => {
  return (
    <div className="flex justify-center gap-1">
      {keys.map((key) => (
        <KeyboardButton
          key={key}
          className="w-[9.5%]"
          onClick={() => onKeyPress(key)}
          onTouchStart={() => onKeyPress(key)}
          isPressed={pressedKey === key}
        >
          {key}
        </KeyboardButton>
      ))}
    </div>
  );
};

export default KeyboardRow;