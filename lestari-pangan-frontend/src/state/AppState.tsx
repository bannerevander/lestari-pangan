import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Recipe } from '../data/recipes'
import type { Challenge, ChallengeEntry, RewardPack } from '../data/engagement'
import type { FundSummary } from '../services/funding'
import type { Promotion } from '../services/promotions'
import type { Ticket } from '../services/support'
import type { FoodRecord, FoodRequest, Issue, Notification, Offer, Role, Tip, Transfer } from '../data/types'

/**
 * Store aplikasi. Data kegiatan selalu dari Supabase lewat aksi `hydrate`
 * (state/LiveData.tsx) dan diubah lewat RPC (state/useCommand.ts), tidak pernah oleh reducer ini.
 * Yang disimpan di perangkat hanya status sesi, peran, dan preferensi.
 */

/** Semua state kecuali status sesi; data selain `prefs` berasal dari Supabase dan tidak disimpan di perangkat. */
export type LiveData = Omit<State, 'signedIn' | 'onboarded' | 'role'>

interface State {
  signedIn: boolean
  onboarded: boolean
  role: Role
  prefs: Record<string, boolean>
  offers: Offer[]
  requests: FoodRequest[]
  transfers: Transfer[]
  records: FoodRecord[]
  notifications: Notification[]
  issues: Issue[]
  /** Tugas relawan/mitra pengiriman (K01–K04); hanya untuk akun kurir. */
  tasks: CourierTask[]
  tips: Tip[]
  recipes: Recipe[]
  savedTips: string[]
  savedRecipes: string[]
  challenges: Challenge[]
  /** Keikutsertaan + progres dari server, per kode challenge. */
  challengeEntries: Record<string, ChallengeEntry>
  joinedChallenges: string[]
  rewardPacks: RewardPack[]
  rewardClaim: string | null
  claimStatus: string | null
  /** Kode keikutsertaan yang lolos dan belum dipakai klaim. */
  claimRight: string | null
  /** Persetujuan mitra atas materi apresiasi (E08/E09); appreciationId null = belum ada materi. */
  appreciation: 'Draf' | 'Disetujui' | 'Revisi diminta'
  appreciationId: number | null
  /** Teks dan gambar materi apresiasi terbaru dari tim program. */
  appreciationCaption: string | null
  appreciationImage: string | null
  supports: Support[]
  recurring: { amount: number; day: number } | null
  inKind: { id: string; kind: string; amount: string; at: string; status: string }[]
  fundSummary: FundSummary[]
  promotions: Promotion[]
  tickets: Ticket[]
}

export interface CourierTask {
  id: string
  transferId: string
  food: string
  agreed: number
  unit: string
  from: { name: string; pic: string; phone: string; address: string; note: string }
  to: { name: string; pic: string; phone: string; address: string; note: string }
  window: string
  cost: string
  status: 'Menunggu kurir' | 'Menunggu ambil' | 'Dalam perjalanan' | 'Selesai' | 'Gagal'
  picked?: number
  delivered?: number
  timeline: { label: string; at: string; note?: string }[]
}

export type ProfileFields = { pic: string; phone: string; address: string; hours: string; area: string; capacity: string; storage: string }
export interface Support {
  id: string
  amount: number
  allocation: string
  at: string
  status: 'Menunggu verifikasi' | 'Tervalidasi' | 'Dibatalkan'
  note?: string
}

export type OfferChanges = Pick<Offer, 'pickupDate' | 'pickupStart' | 'pickupEnd' | 'available' | 'storage' | 'description'>

const empty: Omit<LiveData, 'prefs'> = {
  offers: [],
  requests: [],
  transfers: [],
  records: [],
  notifications: [],
  issues: [],
  tasks: [],
  tips: [],
  recipes: [],
  savedTips: [],
  savedRecipes: [],
  challenges: [],
  challengeEntries: {},
  joinedChallenges: [],
  rewardPacks: [],
  rewardClaim: null,
  claimStatus: null,
  claimRight: null,
  appreciation: 'Draf',
  appreciationId: null,
  appreciationCaption: null,
  appreciationImage: null,
  supports: [],
  recurring: null,
  inKind: [],
  fundSummary: [],
  promotions: [],
  tickets: [],
}

const initial: State = { signedIn: false, onboarded: false, role: 'pemberi', prefs: {}, ...empty }

/** Aksi lokal. Perubahan data kegiatan memakai perintah RPC di state/useCommand.ts. */
export type Action =
  | { type: 'hydrate'; data: Partial<LiveData> }
  | { type: 'signIn'; role?: Role }
  | { type: 'signOut' }
  | { type: 'onboarded' }
  | { type: 'setRole'; role: Role }
  | { type: 'setPref'; key: string; value: boolean }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'hydrate':
      return { ...s, ...a.data }
    case 'signIn':
      return { ...s, signedIn: true, onboarded: true, role: a.role ?? s.role }
    case 'signOut':
      // Data akun sebelumnya tidak boleh terlihat oleh akun berikutnya di perangkat yang sama.
      return { ...s, ...empty, signedIn: false, prefs: {} }
    case 'onboarded':
      return { ...s, onboarded: true }
    case 'setRole':
      return { ...s, role: a.role }
    case 'setPref':
      return { ...s, prefs: { ...s.prefs, [a.key]: a.value } }
  }
}

const KEY = 'lestari-pangan-v4'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>
      return { ...initial, signedIn: !!saved.signedIn, onboarded: !!saved.onboarded, role: saved.role ?? initial.role, prefs: saved.prefs ?? {} }
    }
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
      const { signedIn, onboarded, role, prefs } = state
      localStorage.setItem(KEY, JSON.stringify({ signedIn, onboarded, role, prefs }))
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
