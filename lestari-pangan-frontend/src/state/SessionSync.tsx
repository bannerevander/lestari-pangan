import { useEffect, useRef } from 'react'
import { useApp } from './AppState'
import { hasSession, onSignedOut, signOut } from '../services/auth'

/**
 * Menyelaraskan status masuk aplikasi dengan sesi Supabase (mode live).
 * - Sesi berakhir/tidak ada → aplikasi keluar.
 * - Pengguna keluar dari aplikasi → sesi Supabase ikut diakhiri.
 * Hanya transisi masuk → keluar yang mengakhiri sesi, agar sesi baru selama onboarding tidak terhapus.
 */
export function SessionSync() {
  const { state, dispatch } = useApp()
  const wasSignedIn = useRef(state.signedIn)

  useEffect(() => {
    if (state.signedIn) hasSession().then((ok) => !ok && dispatch({ type: 'signOut' }))
    return onSignedOut(() => dispatch({ type: 'signOut' }))
    // Cukup sekali saat aplikasi dimuat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (wasSignedIn.current && !state.signedIn) void signOut()
    wasSignedIn.current = state.signedIn
  }, [state.signedIn])

  return null
}
