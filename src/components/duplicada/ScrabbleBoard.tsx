// Componente visual del tablero de Scrabble con coordenadas
import React from 'react';
import { BoardCell } from '@/types/duplicada/tournament';
import { getCellClassName, getCellDisplay } from '@/utils/duplicada/board';

interface ScrabbleBoardProps {
  board: BoardCell[][];
  onCellClick?: (row: number, col: number) => void;
  className?: string;
}

const ScrabbleBoard: React.FC<ScrabbleBoardProps> = ({
  board,
  onCellClick,
  className = ""
}) => {
  // Generar números de columnas (1-15) - van arriba/abajo
  const columnLabels = Array.from({ length: 15 }, (_, i) => i + 1);
  
  // Generar letras de filas (A-O) - van a los lados
  const rowLabels = Array.from({ length: 15 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className={`inline-block p-4 bg-gray-200 rounded ${className}`}>
      <div className="relative">
        {/* Etiquetas de columnas superiores */}
        <div className="grid grid-cols-15 gap-0 mb-1 ml-8 mr-8">
          {columnLabels.map((label) => (
            <div 
              key={`col-top-${label}`} 
              className="w-8 h-6 flex items-center justify-center text-sm font-bold text-gray-700"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Etiquetas de filas izquierdas */}
          <div className="flex flex-col gap-0 mr-1">
            {rowLabels.map((label) => (
              <div 
                key={`row-left-${label}`}
                className="w-6 h-8 flex items-center justify-center text-sm font-bold text-gray-700"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Tablero principal */}
          <div className="grid grid-cols-15 gap-0 border-2 border-gray-600">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${getCellClassName(cell.type, !!cell.tile)} ${
                    onCellClick ? 'cursor-pointer hover:opacity-75' : ''
                  }`}
                  onClick={() => onCellClick?.(rowIndex, colIndex)}
                  title={`${rowLabels[rowIndex]}${columnLabels[colIndex]} (${rowLabels[rowIndex]}, ${columnLabels[colIndex]})`}
                >
                  {getCellDisplay(cell.type, cell.tile)}
                </div>
              ))
            )}
          </div>

          {/* Etiquetas de filas derechas */}
          <div className="flex flex-col gap-0 ml-1">
            {rowLabels.map((label) => (
              <div 
                key={`row-right-${label}`}
                className="w-6 h-8 flex items-center justify-center text-sm font-bold text-gray-700"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Etiquetas de columnas inferiores */}
        <div className="grid grid-cols-15 gap-0 mt-1 ml-8 mr-8">
          {columnLabels.map((label) => (
            <div 
              key={`col-bottom-${label}`} 
              className="w-8 h-6 flex items-center justify-center text-sm font-bold text-gray-700"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrabbleBoard;