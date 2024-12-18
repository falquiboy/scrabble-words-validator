import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
        {/* Third row with slash button */}
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
            className="h-14 w-[9.5%] text-xl font-bold"
            onClick={() => onKeyPress("/")}
          >
            /
          </Button>
        </div>
        {/* Bottom row with centered space bar */}
        <div className="flex justify-center items-center gap-1">
          <div className="w-[15%]" /> {/* Left spacer */}
          <div className="border-2 border-gray-300 rounded-xl p-1 w-[40%]">
            <Button
              variant="secondary"
              className="h-10 w-full text-lg font-bold"
              onClick={() => onKeyPress(" ")}
            >
              Espacio
            </Button>
          </div>
          <Button
            variant="destructive"
            className="h-14 w-14 flex items-center justify-center"
            onClick={onClear}
          >
            <Trash2 className="h-6 w-6 text-white" />
          </Button>
          <div className="w-[15%]" /> {/* Right spacer */}
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;