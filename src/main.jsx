import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initGA } from './utils/analytics';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('تحديث جديد متاح! هل تريد تحديث التطبيق؟')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('التطبيق جاهز للعمل بدون إنترنت');
    },
  });
}

// Initialize Google Analytics
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  initGA(GA_MEASUREMENT_ID);
}

// Suppress Service Worker and WebSocket warnings
// These warnings come from the browser itself, not our code
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress Service Worker navigation preload warnings
    if (message.includes('service worker navigation preload') || 
        message.includes('preloadResponse')) {
      return; // Suppress this warning
    }
    // Call original warn for other messages
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress WebSocket connection errors (HMR related)
    if (message.includes('WebSocket connection') || 
        message.includes('failed to connect to websocket')) {
      return; // Suppress this error
    }
    // Call original error for other messages
    originalError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
