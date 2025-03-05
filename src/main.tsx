
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Add app-loaded class to body once React has rendered
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.add('app-loaded');
  }, 1000); // Wait 1 second to ensure app is visible
});
