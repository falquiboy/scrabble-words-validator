// Componente para mostrar resultados de anagramas y subanagramas
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnagramResult } from '@/services/duplicada/AnagramService';
import { Loader2, Zap } from 'lucide-react';

interface AnagramResultsProps {
  exactAnagrams: AnagramResult[];
  subAnagrams: AnagramResult[];
  isLoading: boolean;
  tiles: string[];
  className?: string;
}

const AnagramResults: React.FC<AnagramResultsProps> = ({
  exactAnagrams,
  subAnagrams,
  isLoading,
  tiles,
  className = ""
}) => {
  const totalWords = exactAnagrams.length + subAnagrams.length;

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Palabras Posibles
          </CardTitle>
          <CardDescription>
            Anagramas y subanagramas generados desde: [{tiles.join(', ')}]
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Generando palabras...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Estadísticas */}
              <div className="flex gap-4 text-sm text-gray-600">
                <div>
                  <strong>{exactAnagrams.length}</strong> anagramas exactos
                </div>
                <div>
                  <strong>{subAnagrams.length}</strong> subanagramas
                </div>
                <div>
                  <strong>{totalWords}</strong> palabras total
                </div>
              </div>

              {totalWords === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No se encontraron palabras válidas con estas fichas
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Anagramas Exactos */}
                  {exactAnagrams.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        🎯 Anagramas Exactos ({exactAnagrams.length})
                        <Badge variant="secondary">{tiles.length} fichas</Badge>
                      </h4>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {exactAnagrams.map((result, index) => (
                          <div
                            key={`exact-${index}`}
                            className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200 hover:bg-green-100 transition-colors"
                          >
                            <span className="font-medium text-green-900">
                              {result.word}
                            </span>
                            <Badge className="bg-green-600">
                              {result.length}L
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subanagramas */}
                  {subAnagrams.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        🔄 Subanagramas ({subAnagrams.length})
                        <Badge variant="outline">2-{tiles.length - 1} fichas</Badge>
                      </h4>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {subAnagrams.map((result, index) => (
                          <div
                            key={`sub-${index}`}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <span className="font-medium text-blue-900">
                              {result.word}
                            </span>
                            <Badge variant="outline" className="border-blue-400 text-blue-700">
                              {result.length}L
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnagramResults;