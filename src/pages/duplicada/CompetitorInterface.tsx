// Interfaz para competidores
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';

const CompetitorInterface: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
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
              🎯 Zona de Competición
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Esperando torneo...
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Tu Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>🎲 <strong>Recibirás las mismas fichas</strong> que todos los demás competidores</p>
                <p>🧠 <strong>Encuentra la jugada de mayor valor</strong> posible con esas fichas</p>
                <p>⏱️ <strong>Tiempo limitado</strong> para cada ronda</p>
                <p>🏆 <strong>El que más se acerque al puntaje del Master gana</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Estado Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-100 rounded-lg text-center">
                  <div className="text-lg font-semibold text-yellow-800">
                    Esperando que inicie el torneo
                  </div>
                  <div className="text-sm text-yellow-600 mt-1">
                    El administrador debe configurar la primera ronda
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <strong>Tu información:</strong>
                  <div className="mt-2 space-y-1">
                    <div>Nombre: <em>Por configurar</em></div>
                    <div>Puntaje actual: <strong>0 puntos</strong></div>
                    <div>Posición: <strong>-</strong></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Interfaz de Juego
            </CardTitle>
            <CardDescription>
              Aquí aparecerá tu tablero y fichas cuando inicie la ronda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <div className="text-gray-400 text-lg mb-4">
                🎮 Área de juego
              </div>
              <div className="text-gray-500 text-sm">
                El tablero de Scrabble aparecerá aquí cuando el administrador inicie una ronda.
                <br />
                Podrás arrastrar fichas, formar palabras y confirmar tu jugada.
              </div>
            </div>

            <div className="mt-6 flex gap-4 justify-center">
              <Button disabled variant="outline">
                Formar Palabra
              </Button>
              <Button disabled variant="outline">
                Confirmar Jugada
              </Button>
              <Button disabled variant="outline">
                Limpiar Tablero
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600">
            💡 <strong>Consejo:</strong> Mientras esperas, puedes practicar con las herramientas de +Léxico
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-800 underline">
            Ir al Anagramador →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompetitorInterface;