import { Button } from "@/components/ui/button";

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
}

const CustomKeyboard = ({ onKeyPress, onClear }: CustomKeyboardProps) => {
  const row1 = ['Q', 'E', 'R', 'T', '*', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'L', 'Ñ'];
  const row3 = ['?', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 shadow-lg md:hidden">
      <div className="space-y-2">
        {/* First row */}
        <div className="flex justify-center gap-1">
          {row1.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className="h-12 w-9 text-lg font-semibold"
              onClick={() => onKeyPress(key)}
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
              className="h-12 w-9 text-lg font-semibold"
              onClick={() => onKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
        {/* Third row */}
        <div className="flex justify-center gap-1">
          {row3.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className="h-12 w-9 text-lg font-semibold"
              onClick={() => onKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
        {/* Bottom row */}
        <div className="flex justify-center gap-1">
          <Button
            variant="secondary"
            className="h-12 w-20 text-lg font-semibold"
            onClick={() => onKeyPress(" ")}
          >
            Space
          </Button>
          <Button
            variant="secondary"
            className="h-12 w-12 text-lg font-semibold"
            onClick={() => onKeyPress("/")}
          >
            /
          </Button>
          <Button
            variant="secondary"
            className="h-12 w-20 text-lg font-semibold"
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;