import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import transactLogo from './assets/brand/transact-logo.svg';

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/svg+xml';
favicon.href = transactLogo;
if (!favicon.parentNode) {
  document.head.appendChild(favicon);
}

document.title = 'OpsMind | AI Incident Response Platform';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
