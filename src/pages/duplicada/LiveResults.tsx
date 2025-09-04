// Pantalla de resultados en vivo para proyección
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Monitor, Wifi, Users } from 'lucide-react';

const LiveResults: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header minimalista para proyección */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/duplicada">
              <Button variant="outline" size="sm" className="bg-gray-800 text-white border-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Monitor className="w-6 h-6 text-green-400" />
              <h1 className="text-2xl font-bold">Duplicada Tournament • Live Results</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-green-400">
            <Wifi className="w-4 h-4" />
            <span>LIVE</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Clasificación Principal */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-xl">
                  🏆 Clasificación General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-600">
                    <div className="text-center text-yellow-100 text-lg">
                      Esperando que inicie el torneo...
                    </div>
                    <div className="text-center text-yellow-300/70 text-sm mt-2">
                      Los resultados aparecerán aquí cuando los competidores envíen sus jugadas
                    </div>
                  </div>

                  {/* Template para cuando haya datos */}
                  <div className="hidden opacity-50">
                    <div className="grid grid-cols-5 gap-4 p-3 bg-gray-800 rounded-lg text-sm font-medium text-gray-300 border-b border-gray-700">
                      <div>Posición</div>
                      <div>Jugador</div>
                      <div>Ronda Actual</div>
                      <div>Total</div>
                      <div>Diferencia</div>
                    </div>
                    
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <div key={pos} className="grid grid-cols-5 gap-4 p-3 hover:bg-gray-800/50 rounded-lg text-sm">
                        <div className="text-white font-bold">{pos}º</div>
                        <div className="text-gray-300">Jugador {pos}</div>
                        <div className="text-blue-400">- pts</div>
                        <div className="text-white font-semibold">- pts</div>
                        <div className="text-gray-400">-</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Estado del Torneo */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">
                  📊 Estado del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-gray-300 text-sm">
                  <div>Ronda actual: <strong className="text-white">-</strong></div>
                  <div>Total de rondas: <strong className="text-white">-</strong></div>
                  <div>Tiempo restante: <strong className="text-orange-400">-</strong></div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-0"></div>
                </div>
              </CardContent>
            </Card>

            {/* Participantes */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-300">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-sm">competidores conectados</div>
                </div>
              </CardContent>
            </Card>

            {/* Jugada del Master */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">
                  🎯 Jugada Óptima (Master)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 text-sm">
                  Se revelará al final de cada ronda
                </div>
                <div className="hidden mt-3 p-3 bg-purple-900/30 rounded-lg border border-purple-600">
                  <div className="text-purple-200 text-sm">Palabra: <strong>EJEMPLO</strong></div>
                  <div className="text-purple-200 text-sm">Puntos: <strong>87</strong></div>
                  <div className="text-purple-300/70 text-xs mt-1">Posición: F8 (horizontal)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-6">
            <span>🎮 Scrabble Duplicada</span>
            <span>•</span>
            <span>📡 Resultados en tiempo real</span>
            <span>•</span>
            <span>🏆 Sistema profesional de torneos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveResults;