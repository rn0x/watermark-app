import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';

// Function to handle Cordova and browser initialization
async function handleCordovaReady() {
  console.log("Cordova is ready. Initializing...");

  // Check if Cordova is available and platform is Android
  if (window.cordova && window.cordova.platformId === 'android') {
    // Example Cordova-specific code (update with your requirements)
    if (window.MobileAccessibility) {
      window.MobileAccessibility.usePreferredTextZoom(false);
    }
  }
  // Render the React DOM with the Cordova-specific setup
  renderReactDom();
}

/**
 * Function to render React DOM
 */
function renderReactDom() {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>
  );
}

// Function to inject ads if in a browser environment
function injectAds() {
  if (!window.cordova) {
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7565296297970041";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    script.onload = () => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    };
  }
}

// Check if Cordova is available and handle initialization accordingly
if (window.cordova) {
  document.addEventListener('deviceready', handleCordovaReady, false);
} else {
  console.log("Cordova is not available. Rendering React DOM...");
  renderReactDom(); // Render without Cordova-specific setup
  injectAds();
}
