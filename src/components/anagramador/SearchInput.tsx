import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SearchInputProps {
  letters: string;
  showShorter: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowShorterChange: (checked: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const SearchInput = ({
  letters,
  showShorter,
  onInputChange,
  onSearch,
  onClear,
  onKeyPress,
  onShowShorterChange,
  inputRef
}: SearchInputProps) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={letters}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Ingresa letras..."
          className="pr-24"
          ref={inputRef}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {letters && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="shorter-words"
          checked={showShorter}
          onCheckedChange={onShowShorterChange}
        />
        <Label htmlFor="shorter-words">Incluir palabras más cortas</Label>
      </div>
    </div>
  );
};

export default SearchInput;