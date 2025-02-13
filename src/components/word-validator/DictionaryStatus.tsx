
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, PauseCircle, PlayCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { wordDB } from "@/services/WordDatabase";
import { TOTAL_WORDS } from "@/utils/dictionaryConstants";

interface DictionaryStatusProps {
  totalWords: number;
  currentWords: number;
  isLoading: boolean;
  onResume: () => void;
  onPause: () => void;
  downloadSpeed?: number;
  estimatedTimeRemaining?: number;
}

export const DictionaryStatus = ({
  totalWords,
  currentWords,
  isLoading,
  onResume,
  onPause,
  downloadSpeed,
  estimatedTimeRemaining,
}: DictionaryStatusProps) => {
  const [showWifiDialog, setShowWifiDialog] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const progress = Math.round((currentWords / totalWords) * 100);
  const isComplete = currentWords >= totalWords;
  const isPaused = !isLoading && !isComplete;

  useEffect(() => {
    const checkDictionarySize = async () => {
      try {
        const words = await wordDB.getAllWords();
        setShouldShow(words.length < TOTAL_WORDS);
      } catch (error) {
        console.error('Error checking dictionary size:', error);
        setShouldShow(false);
      }
    };

    checkDictionarySize();
  }, []);

  if (!shouldShow || isComplete) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            {isPaused ? (
              <PauseCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />
            )}
            Dictionary Download
          </h3>
          <span className="text-sm text-muted-foreground">
            {currentWords.toLocaleString()}/{totalWords.toLocaleString()}
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex justify-between text-sm text-muted-foreground">
          {downloadSpeed && (
            <span>{(downloadSpeed / 1024).toFixed(1)} KB/s</span>
          )}
          {estimatedTimeRemaining && (
            <span>~{Math.ceil(estimatedTimeRemaining / 60)}min remaining</span>
          )}
        </div>

        <div className="flex gap-2">
          {isPaused ? (
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => setShowWifiDialog(true)}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Resume Download
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onPause}
            >
              Pause
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showWifiDialog} onOpenChange={setShowWifiDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Dictionary Download?</AlertDialogTitle>
            <AlertDialogDescription>
              The dictionary download requires downloading {((totalWords - currentWords) * 10 / 1024 / 1024).toFixed(1)}MB of data.
              We recommend using WiFi for this operation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onResume();
              setShowWifiDialog(false);
            }}>
              Continue Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
