// Interfaz del administrador para gestionar torneos
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Settings, Users, Shuffle, Eye, Edit3 } from 'lucide-react';
import ScrabbleBoard from '@/components/duplicada/ScrabbleBoard';
import TileRack from '@/components/duplicada/TileRack';
import AnagramResults from '@/components/duplicada/AnagramResults';
import BestMoves from '@/components/duplicada/BestMoves';
import { createEmptyBoard, placeWordOnBoard } from '@/utils/duplicada/board';
import { generateTestTiles, TileBagManager } from '@/utils/duplicada/tiles';
import { anagramService, AnagramResult } from '@/services/duplicada/AnagramService';
import { ExhaustiveMoveGenerator, ScrabbleMove } from '@/services/duplicada/ExhaustiveMoveGenerator';

const AdminInterface: React.FC = () => {
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentTiles, setCurrentTiles] = useState(() => generateTestTiles());
  const [exhaustiveMoveGenerator] = useState(() => new ExhaustiveMoveGenerator());
  const [tileBagManager] = useState(() => new TileBagManager());
  const [exactAnagrams, setExactAnagrams] = useState<AnagramResult[]>([]);
  const [subAnagrams, setSubAnagrams] = useState<AnagramResult[]>([]);
  const [isLoadingAnagrams, setIsLoadingAnagrams] = useState(false);
  const [bestMoves, setBestMoves] = useState<ScrabbleMove[]>([]);
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [customRack, setCustomRack] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);

  // Generar anagramas y mejores jugadas cuando cambien las fichas
  useEffect(() => {
    const generateWordsAndMoves = async () => {
      if (currentTiles.length === 0) return;
      
      // Generar anagramas
      setIsLoadingAnagrams(true);
      try {
        const result = await anagramService.findAllAnagrams(currentTiles);
        setExactAnagrams(result.exactAnagrams);
        setSubAnagrams(result.subAnagrams);
      } catch (error) {
        console.error('Error generando anagramas:', error);
        setExactAnagrams([]);
        setSubAnagrams([]);
      } finally {
        setIsLoadingAnagrams(false);
      }

      // Generar mejores jugadas con el generador exhaustivo
      setIsLoadingMoves(true);
      try {
        const moves = await exhaustiveMoveGenerator.generateAllMoves(currentTiles, board);
        setBestMoves(moves);
      } catch (error) {
        console.error('Error generando jugadas:', error);
        setBestMoves([]);
      } finally {
        setIsLoadingMoves(false);
      }
    };

    generateWordsAndMoves();
  }, [currentTiles, board]);

  const handleGenerateNewTiles = () => {
    setCurrentTiles(generateTestTiles());
  };

  const handleSetCustomRack = () => {
    if (!customRack.trim()) return;
    
    // Convertir entrada a array de fichas válidas manejando dígrafos y comodines
    const input = customRack.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑÇ?]/g, '');
    const tiles: string[] = [];
    
    let i = 0;
    while (i < input.length && tiles.length < 7) {
      // Manejar comodines
      if (input[i] === '?') {
        tiles.push('?');
        i++;
        continue;
      }
      
      // Detectar dígrafos
      if (i < input.length - 1) {
        const digraph = input.substring(i, i + 2);
        if (digraph === 'CH' || digraph === 'LL' || digraph === 'RR') {
          // Para dígrafos, usar el carácter especial correspondiente
          if (digraph === 'CH') tiles.push('Ç');
          else if (digraph === 'LL') tiles.push('K');
          else if (digraph === 'RR') tiles.push('W');
          i += 2;
          continue;
        }
      }
      
      tiles.push(input[i]);
      i++;
    }
    
    if (tiles.length === 0) {
      alert('Introduce fichas válidas (A-Z, Á, É, Í, Ó, Ú, Ü, Ñ, Ç, ?)');
      return;
    }
    
    setCurrentTiles(tiles.slice(0, 7)); // Máximo 7 fichas
    setCustomRack('');
  };

  const handlePlaceBestMove = () => {
    if (bestMoves.length === 0) {
      alert('No hay movimientos disponibles');
      return;
    }

    // Obtener movimientos con la puntuación más alta
    const highestScore = bestMoves[0].score;
    const topMoves = bestMoves.filter(move => move.score === highestScore);
    
    // Si hay empate, elegir uno al azar
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    
    console.log(`🎯 Colocando: ${selectedMove.word} en ${selectedMove.direction === 'horizontal' ? 
      `${String.fromCharCode(65 + selectedMove.startRow)}${selectedMove.startCol + 1}→` : 
      `${selectedMove.startCol + 1}${String.fromCharCode(65 + selectedMove.startRow)}↓`} (${selectedMove.score} pts)`);
    
    // Colocar la palabra en el tablero con información de comodines
    const newBoard = placeWordOnBoard(
      board,
      selectedMove.word,
      selectedMove.startRow,
      selectedMove.startCol,
      selectedMove.direction,
      selectedMove.tilesPlaced
    );
    
    setBoard(newBoard);
    setCurrentScore(currentScore + selectedMove.score);
    
    // Generar nuevo atril
    try {
      // Contar cuántas fichas se usaron (no las que ya estaban en el tablero)
      const tilesUsed = selectedMove.tilesPlaced.length;
      
      // Sacar nuevas fichas del saco
      const newTiles = tileBagManager.drawTiles(tilesUsed);
      
      // Determinar qué fichas del atril se usaron
      const usedTilesCopy = [...currentTiles];
      const remainingTiles: string[] = [];
      
      // Para cada ficha colocada, buscar y eliminar del atril
      for (const placed of selectedMove.tilesPlaced) {
        if (placed.isWildcard) {
          // Si es comodín, buscar y eliminar un '?'
          const wildcardIndex = usedTilesCopy.indexOf('?');
          if (wildcardIndex >= 0) {
            usedTilesCopy.splice(wildcardIndex, 1);
          }
        } else {
          // Buscar la ficha específica
          const tileIndex = usedTilesCopy.indexOf(placed.letter);
          if (tileIndex >= 0) {
            usedTilesCopy.splice(tileIndex, 1);
          }
        }
      }
      
      // Las fichas restantes son las que no se usaron
      remainingTiles.push(...usedTilesCopy);
      
      const nextRack = [...remainingTiles, ...newTiles];
      setCurrentTiles(nextRack);
      setTurnNumber(turnNumber + 1);
      
      console.log(`📦 Nuevo atril: [${nextRack.join(', ')}]`);
      console.log(`📊 Puntuación acumulada: ${currentScore + selectedMove.score} pts`);
      
    } catch (error) {
      console.error('Error generando nuevo atril:', error);
      alert('No hay suficientes fichas en el saco');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/duplicada">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              🔧 Panel de Administración
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Admin • Torneo de Prueba
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel de Control */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Control del Torneo
                </CardTitle>
                <CardDescription>
                  Gestiona rondas y configuraciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg mb-3">
                  <div className="text-sm font-medium text-blue-900">
                    Turno #{turnNumber}
                  </div>
                  <div className="text-lg font-bold text-blue-800">
                    Puntuación: {currentScore} pts
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Fichas restantes: {tileBagManager.getRemainingCount()}
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handlePlaceBestMove}
                  disabled={bestMoves.length === 0 || isLoadingMoves}
                >
                  🎯 Colocar Mejor Jugada
                </Button>
                
                <Button className="w-full" variant="outline">
                  Nuevo Torneo
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    setBoard(createEmptyBoard());
                    setCurrentScore(0);
                    setTurnNumber(1);
                    tileBagManager.reset();
                    setCurrentTiles(tileBagManager.drawTiles(7));
                  }}
                >
                  Reiniciar Tablero
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-3">
                  Jugadores conectados: <strong>0</strong>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  Ver Lista Completa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="w-5 h-5" />
                  Generador de Fichas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-3">
                    Sistema truly random con crypto API
                  </div>
                  <Button 
                    onClick={handleGenerateNewTiles}
                    className="w-full" 
                    variant="outline"
                  >
                    Generar Nuevas Fichas
                  </Button>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Rack Personalizado
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Introduce hasta 7 fichas. Usa ? para comodines (ej: TA?ULEN, OI?SNTW)
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ej: OI?SNTW"
                      value={customRack}
                      onChange={(e) => setCustomRack(e.target.value)}
                      maxLength={7}
                      className="text-sm"
                    />
                    <Button 
                      onClick={handleSetCustomRack}
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Usar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/duplicada/live">
                  <Button className="w-full" variant="secondary">
                    Abrir Pantalla de Proyección
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Área Principal - Tablero y Fichas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Tablero</CardTitle>
                <CardDescription>
                  Tablero estándar de Scrabble 15x15 con multiplicadores oficiales
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div className="scale-75 lg:scale-90">
                  <ScrabbleBoard board={board} />
                </div>
                
                <div className="w-full max-w-2xl">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Fichas de la Ronda Actual:
                  </div>
                  <TileRack tiles={currentTiles} />
                </div>

                {/* Mejores Jugadas */}
                <div className="w-full max-w-4xl">
                  <BestMoves
                    moves={bestMoves}
                    isLoading={isLoadingMoves}
                    tiles={currentTiles}
                    onMoveSelect={(move) => console.log('Selected move:', move)}
                  />
                </div>

                {/* Resultados de Anagramas */}
                <div className="w-full max-w-4xl">
                  <AnagramResults
                    exactAnagrams={exactAnagrams}
                    subAnagrams={subAnagrams}
                    isLoading={isLoadingAnagrams}
                    tiles={currentTiles}
                  />
                </div>

                <div className="w-full max-w-2xl bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    🎯 Próximas Funcionalidades:
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Generador exhaustivo de jugadas óptimas</li>
                    <li>• Colocación manual de fichas para pruebas</li>
                    <li>• Cálculo automático de puntuaciones</li>
                    <li>• Validación de palabras en tiempo real</li>
                    <li>• Sistema de anti-cheat integrado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;