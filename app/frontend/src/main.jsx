import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function(msg, url, lineNo, columnNo, error) {
  const errorMsg = "Error detectado: " + msg + "\nEn: " + url + "\nLínea: " + lineNo;
  console.error(errorMsg);
  // Solo alertar si estamos en producción o si el usuario reporta errores constantes
  if (window.location.hostname !== 'localhost') {
    alert(errorMsg);
  }
  return false;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
