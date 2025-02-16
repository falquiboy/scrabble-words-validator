
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
          className="h-12 pl-4 pr-32 rounded-full bg-[#1A1A1A] border-none text-white placeholder:text-zinc-400"
        />
        <div className="absolute right-2 flex gap-2">
          <Button
            onClick={isRecording ? onStopRecording : onStartRecording}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-zinc-800 text-white"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onSearch}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-zinc-800 text-white"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
