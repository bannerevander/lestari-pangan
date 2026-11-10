import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useApp } from './AppState'
import { useMyProfile } from './MyProfile'
import { loadDonationData } from '../services/donation'
import { loadTasks, loadTransfers } from '../services/fulfillment'
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
const LiveDataContext = createContext<{ refresh: () => Promise<void> }>({ refresh: async () => {} })

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useApp()
  const { profile } = useMyProfile()
  const role = state.role

  const refresh = useCallback(async () => {
    // Tanpa sesi Supabase (mis. status masuk lama di perangkat) tidak ada yang dimuat.
    if (!state.signedIn || !(await hasSession())) return
    const courier = profile?.role === 'kurir'
    const [donation, transfers, records, notifications, issues, tasks, engagement, funding, promotions, tickets] = await Promise.all([
      loadDonationData(),
      loadTransfers(),
      courier ? [] : loadRecords(role),
      loadNotifications(role),
      loadIssues(),
      courier && profile ? loadTasks(profile.id) : [],
      courier ? null : loadEngagement(),
      courier ? null : loadFunding(),
      courier ? [] : loadPromotions(),
      loadTickets(),
    ])
    dispatch({ type: 'hydrate', data: { ...donation, transfers, records, notifications, issues, tasks, ...engagement, ...funding, promotions, tickets } })
  }, [state.signedIn, role, profile, dispatch])

  useEffect(() => {
    refresh().catch(() => {}) // gagal muat (offline): layar tetap menampilkan data terakhir
    // Notifikasi baru (Realtime) menandakan ada perubahan dari pihak lain: muat ulang semuanya.
    const stop = state.signedIn ? subscribeNotifications(() => void refresh().catch(() => {})) : () => {}
    const onVisible = () => document.visibilityState === 'visible' && refresh().catch(() => {})
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, state.signedIn])

  // Preferensi akun ikut profil server; setelah itu diubah lokal + RPC (useCommand 'setPref').
  useEffect(() => {
    if (profile) dispatch({ type: 'hydrate', data: { prefs: (profile.prefs ?? {}) as Record<string, boolean> } })
  }, [profile, dispatch])

  const value = useMemo(() => ({ refresh }), [refresh])
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

export const useLiveData = () => useContext(LiveDataContext)
