import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { demoData, emptyData, type AdminData } from './data'
import { nowLabel } from '../lib/format'
import { isLive } from '../lib/supabase/client'
import { loadAdminData } from '../services/admin'
import { decide as decideLive } from '../services/adminActions'
import { hasSession } from '../services/auth'

/**
 * Store konsol admin, terpisah dari store aplikasi mobile (kunci penyimpanan sendiri).
 * Mode demo: keputusan hanya berlaku di konsol ini. Mode live: data dibaca dari Supabase
 * (services/admin.ts) dan keputusan dikirim lewat RPC admin_* yang menulis audit di server.
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
  /** Nama dan lingkup staf yang masuk (mode live). */
  staff: { name: string; scope: string } | null
  /** Mode demo: status hasil keputusan admin per entitas; menimpa status data demo. */
  status: Record<string, string>
  /** Log audit demo append-only (NFR-02). Mode live memakai data.audit dari server. */
  audit: AuditEntry[]
  seq: number
  data: AdminData
}

const startData = isLive ? emptyData : demoData
const initial: AdminState = { signedIn: false, staff: null, status: {}, audit: startData.audit, seq: 100, data: startData }

type Action =
  | { type: 'signIn'; staff?: AdminState['staff'] }
  | { type: 'signOut' }
  | { type: 'decide'; target: string; before: string; after: string; reason: string }
  | { type: 'hydrate'; data: AdminData }
  | { type: 'reset' }

function reducer(s: AdminState, a: Action): AdminState {
  switch (a.type) {
    case 'signIn':
      return { ...s, signedIn: true, staff: a.staff ?? null }
    case 'signOut':
      return { ...s, signedIn: false, staff: null }
    case 'decide': {
      const seq = s.seq + 1
      const entry: AuditEntry = { id: `AUD-${String(seq).padStart(4, '0')}`, at: nowLabel(), actor: 'Staf Ops Coblong', target: a.target, before: a.before, after: a.after, reason: a.reason }
      return { ...s, seq, status: { ...s.status, [a.target]: a.after }, audit: [entry, ...s.audit] }
    }
    case 'hydrate':
      return { ...s, data: a.data, audit: a.data.audit }
    case 'reset':
      return { ...initial, signedIn: s.signedIn, staff: s.staff }
  }
}

const KEY = 'lestari-pangan-admin-v1'

function load(): AdminState {
  try {
    const raw = localStorage.getItem(KEY)
    // Data selalu dari demo/server, tidak dipulihkan dari perangkat.
    if (raw) return { ...initial, ...JSON.parse(raw), data: startData, ...(isLive ? { audit: [] } : {}) }
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
      // Data tidak disimpan di perangkat; mode live juga tidak menyimpan log audit server.
      localStorage.setItem(KEY, JSON.stringify({ ...state, data: undefined, ...(isLive ? { audit: [] } : {}) }))
    } catch {
      /* abaikan */
    }
  }, [state])

  const refresh = useCallback(async () => {
    if (!isLive || !state.signedIn || !(await hasSession())) return
    const data = await loadAdminData()
    if (data) dispatch({ type: 'hydrate', data })
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
  /** Status terkini sebuah entitas: keputusan admin bila ada (demo), selain itu status dari data. */
  const statusOf = (id: string, fallback: string) => state.status[id] ?? fallback
  /** Simpan keputusan: demo → log lokal; live → RPC lalu muat ulang. Melempar AppError bila ditolak. */
  const decide = async (target: string, before: string, after: string, reason: string) => {
    if (!isLive) return dispatch({ type: 'decide', target, before, after, reason })
    await decideLive(state.data, target, after, reason)
    await refresh()
  }
  return { state, data: state.data, dispatch, statusOf, decide, refresh }
}
