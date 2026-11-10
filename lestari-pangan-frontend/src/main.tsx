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
import { configured } from './lib/supabase/client'

// Mode pratinjau statis (tanpa server) memakai hash routing.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter

/** Build tanpa env Supabase tidak menjalankan aplikasi (mode demo ada di folder ../prototype). */
function NotConfigured() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-page-title">Konfigurasi belum lengkap</h1>
        <p className="mt-2 text-body text-ink-secondary">Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env.local, lalu jalankan ulang.</p>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  !configured ? (
    <NotConfigured />
  ) : (
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
  </StrictMode>
  ),
)
