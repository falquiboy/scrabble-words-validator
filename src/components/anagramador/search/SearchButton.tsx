import { Search, X } from "lucide-react";

interface SearchButtonProps {
  onClick: () => void;
  hasActiveSearch: boolean;
  isDisabled: boolean;
}

const SearchButton = ({ onClick, hasActiveSearch, isDisabled }: SearchButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className="h-8 w-8 p-0 hover:text-gray-600"
      disabled={isDisabled}
    >
      {hasActiveSearch ? (
        <X className="h-4 w-4" />
      ) : (
        <Search className="h-4 w-4" />
      )}
    </button>
  );
};

export default SearchButton;