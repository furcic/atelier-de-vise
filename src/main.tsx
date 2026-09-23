import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './pastel-theme.css';
import './native.css';
import { isMobileBuild } from './preview';
if (isMobileBuild) {
  document.documentElement.classList.add('native-app');
  void import('./native').then(({ initializeNative }) => initializeNative()).catch(console.error);
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
if (import.meta.env.PROD && !isMobileBuild && 'serviceWorker' in navigator)
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(console.error);
  });
