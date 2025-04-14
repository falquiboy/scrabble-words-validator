
import React, { useState } from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface SearchTooltipProps {
  isPatternMode: boolean;
  children: React.ReactNode;
}

export const SearchTooltip = ({ isPatternMode, children }: SearchTooltipProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isPatternMode) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-2">
      {children}
      <TooltipProvider>
        <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Ayuda con patrones</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            align="start"
            className="w-80 p-3 text-sm bg-white"
          >
            <p>* es cualquier letra en cualquier posicion</p>
            <p>? es cualquier letra en posición definida</p>
            <p>- es cero o más letras al comienzo o al término del patrón</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
