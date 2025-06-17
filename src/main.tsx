
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { errorHandler } from './utils/errorHandler'
import { setupQueryPersistence } from './lib/queryClient'

console.log('🚀 Application starting...');
console.log('📊 Environment:', {
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
});

// Set up IndexedDB persistence for React Query
setupQueryPersistence();

// Log any stored errors from previous sessions
try {
  const storedErrors = localStorage.getItem('app_errors');
  if (storedErrors) {
    const errors = JSON.parse(storedErrors);
    console.log(`⚠️ Found ${errors.length} stored errors from previous sessions`);
    if (errors.length > 0) {
      console.group('📋 Previous Session Errors');
      errors.forEach((error: any, index: number) => {
        console.log(`Error ${index + 1}:`, error);
      });
      console.groupEnd();
    }
  }
} catch (e) {
  console.warn('Could not read stored errors:', e);
}

// Add performance monitoring
const startTime = performance.now();

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  
  const endTime = performance.now();
  console.log(`✅ Application rendered successfully in ${(endTime - startTime).toFixed(2)}ms`);
} catch (error) {
  console.error('💥 Critical error during app initialization:', error);
  errorHandler.logError(error as Error, { context: 'app_initialization' });
  
  // Show a basic error message if React fails to render
  document.getElementById('root')!.innerHTML = `
    <div style="
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      font-family: system-ui; 
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #6b7280; margin-bottom: 16px;">
          The application failed to start. Please refresh the page or contact support.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer;
          "
        >
          Refresh Page
        </button>
      </div>
    </div>
  `;
}
