
interface SearchTooltipProps {
  isPatternMode: boolean;
  children: React.ReactNode;
}

export const SearchTooltip = ({ isPatternMode, children }: SearchTooltipProps) => {
  return (
    <div className="relative flex-1">
      {children}
    </div>
  );
};
