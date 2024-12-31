import { Progress } from "@/components/ui/progress";

interface LoadingIndicatorProps {
  progress: number;
  loadStartTime: number;
}

const LoadingIndicator = ({ progress, loadStartTime }: LoadingIndicatorProps) => (
  <div className="space-y-2">
    <Progress value={progress} className="w-full" />
    <p className="text-sm text-center text-gray-500">
      Cargando lexicón... ({((Date.now() - loadStartTime) / 1000).toFixed(1)}s)
    </p>
  </div>
);

export default LoadingIndicator;