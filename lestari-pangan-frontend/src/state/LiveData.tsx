import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './AppState'
import { useMyProfile } from './MyProfile'
import { loadDonationData } from '../services/donation'
import { loadTransfers } from '../services/fulfillment'
import { loadRecords } from '../services/inventory'
import { loadIssues } from '../services/issues'
import { loadNotifications, subscribeNotifications } from '../services/notify'
import { hasSession } from '../services/auth'
import { loadEngagement } from '../services/engagement'
import { loadFunding } from '../services/funding'
import { loadPromotions } from '../services/promotions'
import { loadTickets } from '../services/support'

/**
 * Mode live: memuat data kegiatan dari Supabase ke AppState (aksi `hydrate`),
 * sehingga layar yang ada cukup membaca `state` seperti biasa.
 */
/** loaded: muat pertama untuk akun/peran ini sudah selesai, sehingga daftar kosong berarti benar-benar kosong. */
const LiveDataContext = createContext<{ refresh: () => Promise<void>; loaded: boolean }>({ refresh: async () => {}, loaded: false })

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useApp()
  const { profile } = useMyProfile()
  const role = state.role
  // Muat mana pun yang selesai untuk akun+peran yang sama sudah cukup (StrictMode di dev memuat dua kali).
  const key = `${state.signedIn}|${role}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loaded = loadedKey === key

  const refresh = useCallback(async () => {
    // Tanpa sesi Supabase (mis. status masuk lama di perangkat) tidak ada yang dimuat.
    if (!state.signedIn || !(await hasSession())) return
    const [donation, transfers, records, notifications, issues, engagement, funding, promotions, tickets] = await Promise.all([
      loadDonationData(),
      loadTransfers(),
      loadRecords(role),
      loadNotifications(role),
      loadIssues(),
      loadEngagement(),
      loadFunding(),
      loadPromotions(),
      loadTickets(),
    ])
    dispatch({ type: 'hydrate', data: { ...donation, transfers, records, notifications, issues, ...engagement, ...funding, promotions, tickets } })
  }, [state.signedIn, role, dispatch])

  useEffect(() => {
    // Gagal muat (offline) tetap membuka layar dengan data terakhir.
    refresh()
      .catch(() => {})
      .finally(() => setLoadedKey(key))
    // Notifikasi baru (Realtime) menandakan ada perubahan dari pihak lain: muat ulang semuanya.
    const stop = state.signedIn ? subscribeNotifications(() => void refresh().catch(() => {})) : () => {}
    const onVisible = () => document.visibilityState === 'visible' && refresh().catch(() => {})
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, state.signedIn, key])

  // Preferensi akun ikut profil server; setelah itu diubah lokal + RPC (useCommand 'setPref').
  useEffect(() => {
    if (profile) dispatch({ type: 'hydrate', data: { prefs: (profile.prefs ?? {}) as Record<string, boolean> } })
  }, [profile, dispatch])

  const value = useMemo(() => ({ refresh, loaded }), [refresh, loaded])
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

export const useLiveData = () => useContext(LiveDataContext)
