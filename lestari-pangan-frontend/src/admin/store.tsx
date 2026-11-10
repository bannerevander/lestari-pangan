import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { emptyData, type AdminData } from './data'
import { loadAdminData } from '../services/admin'
import { decide as decideOnServer } from '../services/adminActions'
import { hasSession } from '../services/auth'

/**
 * Store konsol admin, terpisah dari store aplikasi mobile (kunci penyimpanan sendiri).
 * Data dibaca dari Supabase (services/admin.ts); keputusan dikirim lewat RPC admin_*
 * yang menulis audit di server. Yang disimpan di perangkat hanya status masuk staf.
 */

export interface AuditEntry {
  id: string
  at: string
  actor: string
  target: string
  before: string
  after: string
  reason: string
}

interface AdminState {
  signedIn: boolean
  /** Nama dan lingkup staf yang masuk. */
  staff: { name: string; scope: string } | null
  data: AdminData
}

const initial: AdminState = { signedIn: false, staff: null, data: emptyData }

type Action = { type: 'signIn'; staff: NonNullable<AdminState['staff']> } | { type: 'signOut' } | { type: 'hydrate'; data: AdminData }

function reducer(s: AdminState, a: Action): AdminState {
  switch (a.type) {
    case 'signIn':
      return { ...s, signedIn: true, staff: a.staff }
    case 'signOut':
      return initial
    case 'hydrate':
      return { ...s, data: a.data }
  }
}

const KEY = 'lestari-pangan-admin-v2'

function load(): AdminState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AdminState>
      return { ...initial, signedIn: !!saved.signedIn, staff: saved.staff ?? null }
    }
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return initial
}

interface Ctx {
  state: AdminState
  dispatch: React.Dispatch<Action>
  refresh: () => Promise<void>
}

const AdminCtx = createContext<Ctx | null>(null)

export function AdminStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ signedIn: state.signedIn, staff: state.staff }))
    } catch {
      /* abaikan */
    }
  }, [state.signedIn, state.staff])

  const refresh = useCallback(async () => {
    if (!state.signedIn) return
    // Sesi Supabase berakhir: kembali ke halaman masuk staf.
    if (!(await hasSession())) return dispatch({ type: 'signOut' })
    dispatch({ type: 'hydrate', data: await loadAdminData() })
  }, [state.signedIn])

  useEffect(() => {
    refresh().catch(() => {}) // gagal muat: tampilkan data terakhir
    const onVisible = () => document.visibilityState === 'visible' && refresh().catch(() => {})
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const value = useMemo(() => ({ state, dispatch, refresh }), [state, refresh])
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminCtx)
  if (!ctx) throw new Error('useAdmin harus dipakai di dalam AdminStateProvider')
  const { state, dispatch, refresh } = ctx
  /** Simpan keputusan lewat RPC lalu muat ulang. Melempar AppError bila ditolak server. */
  const decide = async (target: string, after: string, reason: string) => {
    await decideOnServer(state.data, target, after, reason)
    await refresh()
  }
  return { state, data: state.data, dispatch, decide, refresh }
}
