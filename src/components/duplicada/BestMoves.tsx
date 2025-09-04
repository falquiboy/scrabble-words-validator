// Componente simplificado para mostrar las mejores jugadas
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrabbleMove } from '@/services/duplicada/ExhaustiveMoveGenerator';
import { Loader2, Trophy } from 'lucide-react';

interface BestMovesProps {
  moves: ScrabbleMove[];
  isLoading: boolean;
  tiles: string[];
  onMoveSelect?: (move: ScrabbleMove) => void;
  className?: string;
}

const BestMoves: React.FC<BestMovesProps> = ({
  moves,
  isLoading,
  tiles,
  onMoveSelect,
  className = ""
}) => {
  const formatCoordinate = (move: ScrabbleMove): string => {
    const rowLabel = String.fromCharCode(65 + move.startRow); // A-O (A=0, H=7)
    const colLabel = move.startCol + 1; // 1-15 (1=0, 8=7)
    
    // Sistema español: Letra primero = horizontal, Número primero = vertical
    if (move.direction === 'horizontal') {
      return `${rowLabel}${colLabel}→`; // H8→
    } else {
      return `${colLabel}${rowLabel}↓`; // 8H↓
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 50) return 'text-purple-600 font-bold';
    if (score >= 30) return 'text-blue-600 font-bold';
    if (score >= 20) return 'text-green-600 font-medium';
    return 'text-gray-700';
  };

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Mejores Jugadas
          </CardTitle>
          <CardDescription>
            Fichas: [{tiles.join(', ')}]
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Generando jugadas...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {moves.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <div className="text-lg mb-2">🤔 No se encontraron jugadas válidas</div>
                </div>
              ) : (
                <>
                  {/* Cabecera */}
                  <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200 text-sm font-medium text-gray-600">
                    <div>Coordenada</div>
                    <div>Palabra</div>
                    <div className="text-right">Puntuación</div>
                  </div>

                  {/* Lista de jugadas */}
                  {moves.map((move, index) => (
                    <div
                      key={`${move.word}-${move.startRow}-${move.startCol}-${index}`}
                      className={`grid grid-cols-3 gap-4 py-3 px-2 rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                        index === 0 ? 'bg-yellow-50 border border-yellow-200' : ''
                      }`}
                      onClick={() => onMoveSelect?.(move)}
                    >
                      {/* Coordenada */}
                      <div className="text-sm font-mono text-gray-700">
                        {formatCoordinate(move)}
                      </div>

                      {/* Palabra */}
                      <div className="text-lg font-bold text-gray-900">
                        {move.word}
                      </div>

                      {/* Puntuación */}
                      <div className={`text-right text-xl ${getScoreColor(move.score)}`}>
                        {move.score}
                      </div>
                    </div>
                  ))}

                  {/* Estadísticas simples */}
                  <div className="pt-4 mt-4 border-t border-gray-200 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>{moves.length} jugadas encontradas</span>
                      {moves.length > 0 && (
                        <span>
                          Mejor: <strong className="text-purple-600">{moves[0]?.score}</strong> pts
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BestMoves;