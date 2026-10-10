import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { logError } from './components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => logError(e.message || 'window error'));
window.addEventListener('unhandledrejection', (e) => logError(`unhandled: ${String(e.reason)}`));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
