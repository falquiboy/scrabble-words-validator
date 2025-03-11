import { Search, X } from "lucide-react";
interface SearchButtonProps {
  onClick: () => void;
  hasActiveSearch: boolean;
  isDisabled: boolean;
}
const SearchButton = ({
  onClick,
  hasActiveSearch,
  isDisabled
}: SearchButtonProps) => {
  return <button onClick={onClick} disabled={isDisabled} className="h-8 w-8 p-0 hover:text-gray-600 px-[2px] mx-0 my-[6px]">
      {hasActiveSearch ? <X className="h-5 w-5 mx-[5px]" /> : <Search className="h-5 w-5 mx-[5px]" />}
    </button>;
};
export default SearchButton;