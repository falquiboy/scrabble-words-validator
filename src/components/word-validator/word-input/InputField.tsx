import React from 'react';

interface InputFieldProps {
  word: string;
  inputRef: React.RefObject<HTMLInputElement>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  getInputBackground: () => string;
}

const InputField = ({
  word,
  inputRef,
  handleInputChange,
  handleKeyDown,
  getInputBackground,
}: InputFieldProps) => {
  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Escribe una o más palabras..."
      value={word}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      className={`w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400 caret-current ${
        getInputBackground() === "bg-white text-black" 
          ? "text-black caret-blue-500" 
          : "text-white caret-white"
      }`}
      autoFocus
      spellCheck="false"
      autoCorrect="off"
      autoCapitalize="off"
      autoComplete="off"
      inputMode="none"
      enterKeyHint="done"
    />
  );
};

export default InputField;