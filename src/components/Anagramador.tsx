import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

const Anagramador = () => {
  const [letters, setLetters] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md space-y-4">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Ingresa letras..."
        value={letters}
        onChange={(e) => setLetters(e.target.value.toUpperCase())}
        className="text-2xl font-bold h-16 text-left"
        autoFocus
      />
      <div className="min-h-[100px] text-left">
        {/* Results will be displayed here */}
      </div>
    </div>
  );
};

export default Anagramador;