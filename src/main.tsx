
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Aseguramos que la aplicación se renderice en español
document.documentElement.lang = 'es';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js?v=2', { updateViaCache: 'none' }).catch((error) => {
      console.warn('No se pudo registrar el modo offline.', error);
    });
  });
}
