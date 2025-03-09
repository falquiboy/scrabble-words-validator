
import { Progress } from "@/components/ui/progress";

interface LoadingIndicatorProps {
  progress: number;
  loadStartTime: number;
  stage?: 'download' | 'processing' | 'building';
}

const LoadingIndicator = ({ progress, loadStartTime, stage = 'processing' }: LoadingIndicatorProps) => {
  const getStageText = (): string => {
    switch (stage) {
      case 'download':
        return 'Descargando diccionario...';
      case 'processing':
        return 'Procesando diccionario...';
      case 'building':
        return 'Construyendo índice...';
      default:
        return 'Cargando diccionario...';
    }
  };

  const getIndicatorColor = (): string => {
    switch (stage) {
      case 'download':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-primary';
      case 'building':
        return 'bg-amber-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="space-y-2">
      <Progress value={progress} indicatorColor={getIndicatorColor()} className="w-full" />
      <div className="flex justify-between text-sm text-gray-500">
        <p>{getStageText()} ({Math.floor(progress)}%)</p>
        <p>Tiempo: {((Date.now() - loadStartTime) / 1000).toFixed(1)}s</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
