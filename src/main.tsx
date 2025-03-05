
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { APP_LOADED_EVENT } from './hooks/useSplashScreen.ts';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Listen for the app-fully-loaded event to hide the splash screen
document.addEventListener(APP_LOADED_EVENT, () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.classList.add('splash-hidden');
    // Remove the splash screen element after transition completes
    setTimeout(function() {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 500);
  }
  
  // Add app-loaded class to body once app is loaded
  document.body.classList.add('app-loaded');
});
