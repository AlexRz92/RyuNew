import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { applyStoreMeta } from './lib/applyStoreMeta';
import App from './App.tsx';
import './index.css';

// Aplica la identidad de la tienda (título, favicon, meta tags) desde la config.
applyStoreMeta();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
