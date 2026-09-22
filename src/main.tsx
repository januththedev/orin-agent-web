import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);

// Kill stale service workers from any previous deployment of this origin.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((rs) => rs.forEach((r) => r.unregister().catch(() => undefined)))
    .catch(() => undefined);
}

window.addEventListener('error', (e) => {
  if (window.location.hostname === 'localhost') console.warn('[orin-agent-web]', e.message);
});
export {};
