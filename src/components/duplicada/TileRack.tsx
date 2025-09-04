// Componente para mostrar las fichas del jugador
import React from 'react';
import { TileBagManager } from '@/utils/duplicada/tiles';

interface TileRackProps {
  tiles: string[];
  onTileClick?: (tile: string, index: number) => void;
  selectedTile?: number;
  className?: string;
}

const TileRack: React.FC<TileRackProps> = ({
  tiles,
  onTileClick,
  selectedTile,
  className = ""
}) => {
  return (
    <div className={`flex gap-2 p-4 bg-amber-100 rounded-lg border-2 border-amber-300 ${className}`}>
      <div className="text-sm font-semibold text-amber-800 mr-4 flex items-center">
        Fichas:
      </div>
      {tiles.map((tile, index) => (
        <div
          key={`${tile}-${index}`}
          className={`
            w-10 h-10 bg-yellow-200 border-2 border-yellow-400 rounded
            flex items-center justify-center font-bold text-lg cursor-pointer
            hover:bg-yellow-300 transition-colors relative
            ${selectedTile === index ? 'ring-2 ring-blue-500 bg-yellow-300' : ''}
          `}
          onClick={() => onTileClick?.(tile, index)}
        >
          <span className="text-black">{tile}</span>
          <span className="absolute bottom-0 right-0 text-xs text-gray-600 font-normal">
            {TileBagManager.getTileValue(tile)}
          </span>
        </div>
      ))}
      <div className="ml-4 flex items-center text-sm text-gray-600">
        Total: {tiles.reduce((sum, tile) => sum + TileBagManager.getTileValue(tile), 0)} pts
      </div>
    </div>
  );
};

export default TileRack;