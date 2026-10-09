import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import * as mock from '../data/mock'
import type { FoodRecord, FoodRequest, Notification, Offer, Role, Transfer } from '../data/types'
import { nowLabel } from '../lib/format'

/**
 * Store demo di sisi klien. Tidak ada backend: semua hasil "server" disimulasikan
 * agar alur UI dapat dicoba. Keputusan bisnis yang masih terbuka (OD-01 dst.)
 * tidak ditetapkan oleh logika di sini.
 */

interface State {
  signedIn: boolean
  onboarded: boolean
  role: Role
  offers: Offer[]
  requests: FoodRequest[]
  transfers: Transfer[]
  records: FoodRecord[]
  notifications: Notification[]
  savedTips: string[]
  seq: number
}

const initial: State = {
  signedIn: false,
  onboarded: false,
  role: 'pemberi',
  offers: mock.offers,
  requests: mock.requests,
  transfers: mock.transfers,
  records: mock.records,
  notifications: mock.notifications,
  savedTips: [],
  seq: 900,
}

type Action =
  | { type: 'signIn'; role?: Role }
  | { type: 'signOut' }
  | { type: 'onboarded' }
  | { type: 'setRole'; role: Role }
  | { type: 'publishOffer'; offer: Omit<Offer, 'id' | 'createdAt' | 'reserved' | 'handedOver' | 'available'>; recordId?: string }
  | { type: 'closeOffer'; id: string }
  | { type: 'submitRequest'; request: Omit<FoodRequest, 'id' | 'status' | 'createdAt'> }
  | { type: 'decideRequest'; id: string; decision: 'approve' | 'reject'; reason?: string }
  | { type: 'cancelRequest'; id: string; reason: string }
  | { type: 'handover'; id: string; quantity: number }
  | { type: 'receive'; id: string; received: number; reason?: string }
  | { type: 'reportDistribution'; id: string; distributed: number; used: number; wasted: number }
  | { type: 'addRecord'; record: Omit<FoodRecord, 'id'> }
  | { type: 'readNotification'; id: string }
  | { type: 'toggleTip'; id: string }
  | { type: 'reset' }

function reducer(s: State, a: Action): State {
  const at = nowLabel()
  switch (a.type) {
    case 'signIn':
      return { ...s, signedIn: true, onboarded: true, role: a.role ?? s.role }
    case 'signOut':
      return { ...s, signedIn: false }
    case 'onboarded':
      return { ...s, onboarded: true }
    case 'setRole':
      return { ...s, role: a.role }
    case 'publishOffer': {
      const seq = s.seq + 1
      const offer: Offer = {
        ...a.offer,
        id: `PGR-${seq}`,
        available: a.offer.initial,
        reserved: 0,
        handedOver: 0,
        createdAt: at,
      }
      const records = a.recordId
        ? s.records.map((r) => (r.id === a.recordId ? { ...r, status: 'Ditawarkan' as const } : r))
        : s.records
      return { ...s, seq, offers: [offer, ...s.offers], records }
    }
    case 'closeOffer':
      return { ...s, offers: s.offers.map((o) => (o.id === a.id ? { ...o, status: 'Ditutup' } : o)) }
    case 'submitRequest': {
      const seq = s.seq + 1
      const req: FoodRequest = { ...a.request, id: `REQ-${seq}`, status: 'Diajukan', createdAt: at }
      return { ...s, seq, requests: [req, ...s.requests] }
    }
    case 'decideRequest': {
      const req = s.requests.find((r) => r.id === a.id)
      if (!req || req.status !== 'Diajukan') return s
      if (a.decision === 'reject') {
        return {
          ...s,
          requests: s.requests.map((r) => (r.id === a.id ? { ...r, status: 'Ditolak', reason: a.reason } : r)),
        }
      }
      const offer = s.offers.find((o) => o.id === req.offerId)
      if (!offer || req.quantity > offer.available) return s
      const seq = s.seq + 1
      const [date, time] = req.pickupTime.split(', ')
      const transfer: Transfer = {
        id: `LP-${seq}`,
        requestId: req.id,
        offerId: offer.id,
        foodName: offer.name,
        photo: offer.photo,
        donorName: offer.donorName,
        recipientName: req.recipientName,
        agreed: req.quantity,
        unit: req.unit,
        method: req.method,
        date: date ?? offer.pickupDate,
        timeStart: offer.pickupStart,
        timeEnd: offer.pickupEnd,
        status: 'Terjadwal',
        distributionReported: false,
        timeline: [
          { label: 'Permintaan diajukan', at: req.createdAt, by: req.recipientName },
          { label: 'Permintaan disetujui', at, by: offer.donorName, note: `${req.quantity} ${req.unit}, ${time ?? ''}`.trim() },
        ],
      }
      return {
        ...s,
        seq,
        requests: s.requests.map((r) => (r.id === a.id ? { ...r, status: 'Disetujui' } : r)),
        offers: s.offers.map((o) =>
          o.id === offer.id ? { ...o, available: o.available - req.quantity, reserved: o.reserved + req.quantity } : o,
        ),
        transfers: [transfer, ...s.transfers],
      }
    }
    case 'cancelRequest':
      return {
        ...s,
        requests: s.requests.map((r) =>
          r.id === a.id && r.status === 'Diajukan' ? { ...r, status: 'Dibatalkan', reason: a.reason } : r,
        ),
      }
    case 'handover':
      return {
        ...s,
        transfers: s.transfers.map((t) =>
          t.id === a.id && t.status === 'Terjadwal'
            ? {
                ...t,
                status: 'Diserahkan',
                handedOver: a.quantity,
                timeline: [...t.timeline, { label: 'Diserahkan', at, by: t.donorName, note: `${a.quantity} ${t.unit} diserahkan` }],
              }
            : t,
        ),
      }
    case 'receive':
      return {
        ...s,
        transfers: s.transfers.map((t) => {
          if (t.id !== a.id || (t.status !== 'Diserahkan' && t.status !== 'Terjadwal')) return t
          const base = t.handedOver ?? t.agreed
          const status: Transfer['status'] = a.received === 0 ? 'Ditolak' : a.received < base ? 'Diterima sebagian' : 'Diterima penuh'
          const note =
            status === 'Diterima penuh'
              ? `${a.received} ${t.unit} diterima`
              : `${a.received} ${t.unit} diterima, ${base - a.received} ${t.unit} ditolak${a.reason ? `: ${a.reason}` : ''}`
          return {
            ...t,
            status,
            handedOver: base,
            received: a.received,
            rejected: base - a.received,
            timeline: [...t.timeline, { label: status, at, by: t.recipientName, note }],
          }
        }),
      }
    case 'reportDistribution':
      return {
        ...s,
        transfers: s.transfers.map((t) =>
          t.id === a.id
            ? {
                ...t,
                distributionReported: true,
                timeline: [
                  ...t.timeline,
                  {
                    label: 'Laporan distribusi disimpan',
                    at,
                    by: t.recipientName,
                    note: `${a.distributed} didistribusikan, ${a.used} digunakan, ${a.wasted} terbuang`,
                  },
                ],
              }
            : t,
        ),
      }
    case 'addRecord': {
      const seq = s.seq + 1
      return { ...s, seq, records: [{ ...a.record, id: `CP-${seq}` }, ...s.records] }
    }
    case 'readNotification':
      return { ...s, notifications: s.notifications.map((n) => (n.id === a.id ? { ...n, read: true } : n)) }
    case 'toggleTip':
      return {
        ...s,
        savedTips: s.savedTips.includes(a.id) ? s.savedTips.filter((t) => t !== a.id) : [...s.savedTips, a.id],
      }
    case 'reset':
      return { ...initial, signedIn: s.signedIn, onboarded: true, role: s.role }
  }
}

const KEY = 'lestari-pangan-demo-v1'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
  } catch {
    /* penyimpanan tidak tersedia: pakai data awal */
  }
  return initial
}

interface Ctx {
  state: State
  dispatch: React.Dispatch<Action>
}

const AppStateContext = createContext<Ctx | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* abaikan */
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp harus dipakai di dalam AppStateProvider')
  return ctx
}

export function useProfile() {
  const { state } = useApp()
  return state.role === 'pemberi' ? mock.DONOR : mock.RECIPIENT
}
