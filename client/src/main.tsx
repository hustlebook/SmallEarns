import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple version check - no aggressive cache management
const simpleVersionCheck = async () => {
  try {
    const deployedVersion = await fetch('/version.txt?t=' + Date.now())
      .then(res => res.text())
      .catch(() => '0');
    
    localStorage.setItem('appVersion', deployedVersion);
    console.log('App version:', deployedVersion);
  } catch (error) {
    console.log('Version check error:', error);
  }
};

// Safari-compatible service worker registration  
if ('serviceWorker' in navigator && (!navigator.userAgent.includes('Safari') || navigator.userAgent.includes('Chrome'))) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully');
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed, continuing without it');
      });
  });
}

// Run simple version check before app initialization
simpleVersionCheck().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
