
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, ArrowUp } from "lucide-react";

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isLoading: boolean;
}

const SearchInput = ({
  query,
  onQueryChange,
  onSearch,
  isRecording,
  onStartRecording,
  onStopRecording,
  isLoading
}: SearchInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex items-center">
        <Input
          placeholder="Hazlo como aquí"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-20 pl-4 pr-16 rounded-full bg-[#1A1A1A] border-none text-white placeholder:text-zinc-400 whitespace-normal break-words"
        />
        <div className="absolute right-2 flex gap-2">
          <Button
            onClick={isRecording ? onStopRecording : onStartRecording}
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${isRecording ? 'bg-white text-black' : 'text-white'} hover:bg-white hover:text-black transition-colors`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onSearch}
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-white hover:bg-white/90 text-black translate-y-0.5"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
