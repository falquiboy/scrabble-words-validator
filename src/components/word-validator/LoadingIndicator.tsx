
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { LoadingStage } from "@/hooks/useWordDatabase";

interface LoadingIndicatorProps {
  progress: number;
  loadStartTime: number;
  stage?: LoadingStage;
  isFirstLoad?: boolean;
}

const LoadingIndicator = ({ 
  progress, 
  loadStartTime, 
  stage = 'processing',
  isFirstLoad = false
}: LoadingIndicatorProps) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  useEffect(() => {
    if (!isFirstLoad) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - loadStartTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loadStartTime, isFirstLoad]);
  
  const formatElapsedTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageText = (): string => {
    switch (stage) {
      case 'initializing':
        return 'Iniciando aplicación';
      case 'download':
        return 'Descargando diccionario';
      case 'processing':
        return 'Procesando diccionario';
      case 'building':
        return 'Preparando diccionario';
      case 'complete':
        return 'Diccionario listo';
      default:
        return 'Cargando diccionario';
    }
  };

  const getIndicatorColor = (): string => {
    switch (stage) {
      case 'initializing':
        return 'bg-gray-400';
      case 'download':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-green-500';
      case 'building':
        return 'bg-amber-500';
      case 'complete':
        return 'bg-green-600';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="space-y-2">
      <Progress value={progress} indicatorColor={getIndicatorColor()} className="w-full" />
      <div className="flex justify-between text-sm text-gray-500">
        <p>{getStageText()} ({Math.floor(progress)}%)</p>
        {isFirstLoad && (
          <p>Tiempo: {formatElapsedTime(elapsedTime)}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;
