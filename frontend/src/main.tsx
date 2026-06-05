import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Auto-reload on dynamic import failures (Vite chunk mismatch after new deploy or container restart)
window.addEventListener("error", (e) => {
  if (e.message && (e.message.includes("dynamically imported module") || e.message.includes("Importing a module script failed"))) {
    console.warn("Dynamic import failed. Reloading page...", e);
    window.location.reload();
  }
}, true);

window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  if (reason && reason.message && (reason.message.includes("dynamically imported module") || reason.message.includes("Importing a module script failed"))) {
    console.warn("Dynamic import promise rejected. Reloading page...", e);
    window.location.reload();
  }
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
