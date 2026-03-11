import { StrictMode } from 'react'
// polyfill `global` for some browser packages (simple-peer, randombytes)
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ui.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </StrictMode>,
)