import { Button } from "@/components/ui/button";

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
}

const CustomKeyboard = ({ onKeyPress, onClear }: CustomKeyboardProps) => {
  const row1 = ['Q', '*', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', '?', 'L', 'Ñ'];
  const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 shadow-lg md:hidden">
      <div className="space-y-2 pb-safe">
        {/* First row */}
        <div className="flex justify-center gap-1">
          {row1.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className="h-14 w-[9.5%] text-xl font-bold"
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
              className="h-14 w-[9.5%] text-xl font-bold"
              onClick={() => onKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
        {/* Third row with clear button */}
        <div className="flex justify-center gap-1">
          {row3.map((key) => (
            <Button
              key={key}
              variant="secondary"
              className="h-14 w-[9.5%] text-xl font-bold"
              onClick={() => onKeyPress(key)}
            >
              {key}
            </Button>
          ))}
          <Button
            variant="secondary"
            className="h-14 w-[9.5%] text-lg font-bold"
            onClick={onClear}
          >
            ←
          </Button>
        </div>
        {/* Bottom row with centered space bar */}
        <div className="flex justify-center gap-1">
          <div className="w-[9.5%]" /> {/* Spacer */}
          <Button
            variant="secondary"
            className="h-14 w-[50%] text-lg font-bold"
            onClick={() => onKeyPress(" ")}
          >
            Espacio
          </Button>
          <Button
            variant="secondary"
            className="h-14 w-[30%] text-lg font-bold"
            onClick={() => onKeyPress("/")}
          >
            /
          </Button>
          <div className="w-[9.5%]" /> {/* Spacer */}
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;