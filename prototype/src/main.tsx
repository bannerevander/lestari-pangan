import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppStateProvider } from './state/AppState'
import { SessionSync } from './state/SessionSync'
import { MyProfileProvider } from './state/MyProfile'
import { LiveDataProvider } from './state/LiveData'

// Mode pratinjau statis (tanpa server) memakai hash routing.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <AppStateProvider>
          <SessionSync />
          <MyProfileProvider>
            <LiveDataProvider>
              <App />
            </LiveDataProvider>
          </MyProfileProvider>
        </AppStateProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
)
