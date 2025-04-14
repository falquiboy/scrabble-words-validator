
import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface SearchTooltipProps {
  isPatternMode: boolean;
  children: React.ReactNode;
}

export const SearchTooltip = ({
  isPatternMode,
  children
}: SearchTooltipProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <div className="flex flex-col space-y-2">
      {children}
      <TooltipProvider>
        <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-full"
            onClick={toggleTooltip}
          >
            <HelpCircle className="h-5 w-5 mr-2" />
            <span>Ayuda</span>
          </Button>
          {showTooltip && (
            <TooltipContent side="bottom" align="start" className="w-80 p-3 text-sm bg-white">
              <div className="space-y-2">
                <p>* es cualquier letra en cualquier posicion</p>
                <p>? es cualquier letra en posición definida</p>
                <p>- es cero o más letras al comienzo o al término del patrón</p>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <p className="font-bold">PATRON,LETRAS</p>
                  <p>Rellena el patrón solo con las letras disponibles.</p>
                  <p>Ej. -S?R-,AEOCN = CASERON, entre otros.</p>
                </div>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
