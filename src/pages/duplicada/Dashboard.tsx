// Dashboard principal para el Tournament Manager de Duplicada
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Monitor, Play } from 'lucide-react';

const DuplicadaDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏆 Duplicada Tournament Manager
          </h1>
          <p className="text-xl text-gray-600">
            Sistema profesional de gestión de torneos de Scrabble Duplicada
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Modalidad sin suerte • Mismas fichas para todos • El mejor puntaje gana
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Administrador
              </CardTitle>
              <CardDescription>
                Gestiona torneos, rondas y supervisa la competencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/duplicada/admin">
                <Button className="w-full" variant="default">
                  Acceder como Admin
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Competidor
              </CardTitle>
              <CardDescription>
                Interfaz para participantes del torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/duplicada/competitor">
                <Button className="w-full" variant="default">
                  Unirse como Competidor
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-green-600" />
                Resultados en Vivo
              </CardTitle>
              <CardDescription>
                Pantalla de proyección para espectadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/duplicada/live">
                <Button className="w-full" variant="outline">
                  Ver Resultados
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-600" />
              Demo del Sistema
            </CardTitle>
            <CardDescription>
              Prueba las funcionalidades básicas del tablero y fichas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-4">
              🎯 <strong>Próximas características:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Tablero interactivo de Scrabble 15x15</li>
                <li>Sistema de reparto truly random de fichas</li>
                <li>Algoritmo GADDAG para encontrar jugadas óptimas</li>
                <li>Gestión completa de torneos presenciales</li>
                <li>Medidas anti-cheat y trazabilidad</li>
              </ul>
            </div>
            <Button variant="secondary" className="w-full">
              Próximamente - Demo Interactivo
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Volver a +Léxico
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DuplicadaDashboard;