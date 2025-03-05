
import { useEffect } from 'react';

export const APP_LOADED_EVENT = 'app-fully-loaded';

interface SplashScreenOptions {
  progress: number;
  isLoading: boolean;
  message?: string;
}

export const useSplashScreen = ({ progress, isLoading, message }: SplashScreenOptions) => {
  useEffect(() => {
    // Update the loading progress
    const progressBar = document.getElementById('loading-progress-bar');
    const percentageText = document.getElementById('loading-percentage');
    const messageText = document.getElementById('loading-message');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    if (percentageText) {
      percentageText.textContent = `${Math.round(progress)}%`;
    }

    if (messageText && message) {
      messageText.textContent = message;
    }
    
    // If loading is complete, dispatch an event to hide the splash screen
    if (!isLoading && progress >= 100) {
      setTimeout(() => {
        document.dispatchEvent(new Event(APP_LOADED_EVENT));
      }, 500); // Small delay to ensure everything is rendered
    }
  }, [progress, isLoading, message]);
};
