import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')!;

window.addEventListener('error', (event) => {
  rootElement.innerHTML = `<div style="color:red; padding:20px;"><h1>Error:</h1><pre>${event.error?.stack || event.message}</pre></div>`;
});

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
