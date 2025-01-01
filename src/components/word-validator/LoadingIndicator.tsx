import { Progress } from "@/components/ui/progress";

interface LoadingIndicatorProps {
  progress: number;
  loadStartTime: number;
}

const LoadingIndicator = ({ progress, loadStartTime }: LoadingIndicatorProps) => (
  <div className="space-y-2">
    <Progress value={progress} className="w-full" />
    <div className="flex justify-between text-sm text-gray-500">
      <p>Loading dictionary... ({progress}%)</p>
      <p>Time: {((Date.now() - loadStartTime) / 1000).toFixed(1)}s</p>
    </div>
  </div>
);

export default LoadingIndicator;