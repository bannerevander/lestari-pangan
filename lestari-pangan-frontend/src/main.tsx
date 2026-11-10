import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AppStateProvider } from './state/AppState'

// Mode pratinjau statis (tanpa server) memakai hash routing.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </Router>
  </StrictMode>,
)
