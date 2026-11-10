import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import * as mock from '../data/mock'
import { recipes as RECIPES, type Recipe } from '../data/recipes'
import { CHALLENGES, REWARD_PACKS, type Challenge, type ChallengeEntry, type RewardPack } from '../data/engagement'
import type { FundSummary } from '../services/funding'
import type { FoodRecord, FoodRequest, Issue, Notification, Offer, Role, Tip, Transfer } from '../data/types'
import { nowLabel } from '../lib/format'
import { isLive } from '../lib/supabase/client'

/**
 * Store aplikasi. Mode demo: semua hasil "server" disimulasikan di sini.
 * Mode live: data yang sudah tersambung (LIVE_KEYS) diisi dari Supabase lewat aksi `hydrate`
 * dan diubah lewat RPC (state/useCommand.ts), bukan oleh reducer ini.
 */

/** Bagian state yang di mode live berasal dari Supabase. */
const LIVE_KEYS = [
  'offers', 'requests', 'transfers', 'records', 'notifications', 'issues', 'tasks',
  'tips', 'recipes', 'savedTips', 'savedRecipes', 'challenges', 'challengeEntries', 'joinedChallenges',
  'rewardPacks', 'rewardClaim', 'claimStatus', 'claimRight', 'appreciation', 'appreciationId',
  'supports', 'recurring', 'inKind', 'fundSummary',
] as const
export type LiveData = Pick<State, (typeof LIVE_KEYS)[number] | 'prefs'>

interface State {
  signedIn: boolean
  onboarded: boolean
  role: Role
  offers: Offer[]
  requests: FoodRequest[]
  transfers: Transfer[]
  records: FoodRecord[]
  notifications: Notification[]
  issues: Issue[]
  savedTips: string[]
  seq: number
  /** Perubahan profil yang disimpan pengguna; nama usaha tetap dari verifikasi. */
  profileEdits: Partial<Record<Role, Partial<ProfileFields>>>
  prefs: Record<string, boolean>
  rewardClaim: string | null
  supports: Support[]
  savedRecipes: string[]
  joinedChallenges: string[]
  /** Persetujuan mitra atas materi apresiasi (E08/E09). */
  appreciation: 'Draf' | 'Disetujui' | 'Revisi diminta'
  recurring: { amount: number; day: number } | null
  inKind: { id: string; kind: string; amount: string; at: string; status: string }[]
  /** Tugas relawan/mitra pengiriman (K01–K04); hanya untuk akun yang ditugaskan. */
  tasks: CourierTask[]
  tips: Tip[]
  recipes: Recipe[]
  challenges: Challenge[]
  /** Mode live: keikutsertaan + progres dari server, per kode challenge. */
  challengeEntries: Record<string, ChallengeEntry>
  rewardPacks: RewardPack[]
  claimStatus: string | null
  /** Kode keikutsertaan yang lolos dan belum dipakai klaim (mode live). */
  claimRight: string | null
  appreciationId: number | null
  /** null = mode demo (angka ilustratif). */
  fundSummary: FundSummary[] | null
}

export interface CourierTask {
  id: string
  transferId: string
  food: string
  agreed: number
  unit: string
  from: { name: string; pic: string; address: string; note: string }
  to: { name: string; pic: string; address: string; note: string }
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

const initial: State = {
  signedIn: false,
  onboarded: false,
  role: 'pemberi',
  offers: isLive ? [] : mock.offers,
  requests: isLive ? [] : mock.requests,
  transfers: isLive ? [] : mock.transfers,
  records: isLive ? [] : mock.records,
  notifications: isLive ? [] : mock.notifications,
  issues: isLive ? [] : mock.issues,
  savedTips: [],
  seq: 900,
  profileEdits: {},
  prefs: {},
  rewardClaim: null,
  supports: isLive ? [] : [
    { id: 'DKG-7091', amount: 100000, allocation: 'Wadah higienis dan operasional', at: '1 Okt 2026, 10.12 WIB', status: 'Tervalidasi', note: 'Tersalurkan ke pos Coblong' },
    { id: 'DKG-6950', amount: 25000, allocation: 'Subsidi ongkir dan relawan', at: '24 Sep 2026, 15.40 WIB', status: 'Dibatalkan', note: 'Penjemputan dialihkan ke ambil sendiri tanpa biaya.' },
  ],
  savedRecipes: ['nasi-goreng-sayur', 'tumis-jamur'],
  joinedChallenges: [],
  appreciation: 'Draf',
  appreciationId: null,
  tips: mock.tips,
  recipes: RECIPES,
  challenges: CHALLENGES,
  challengeEntries: {},
  rewardPacks: REWARD_PACKS,
  claimStatus: null,
  claimRight: null,
  fundSummary: null,
  recurring: null,
  inKind: [],
  tasks: isLive ? [] : [
    {
      id: 'DEL-2026-081',
      transferId: 'LP-DEMO-01',
      food: 'Nasi kotak ayam dan sayur',
      agreed: 12,
      unit: 'porsi',
      from: { name: 'Warung Kebun', pic: 'Rina Kusuma', address: 'Jl. Contoh No. 42, Sekeloa, Coblong', note: 'Masuk lewat pintu samping dekat parkir motor.' },
      to: { name: 'Komunitas Berbagi', pic: 'Dimas Pratama', address: 'Posko Jl. Contoh No. 7, Dago, Coblong', note: 'Serahkan ke meja piket posko.' },
      window: '10 Okt 2026, 16.00–18.00 WIB',
      cost: 'Ditanggung sponsor (pos kas Coblong)',
      status: 'Menunggu ambil',
      timeline: [{ label: 'Tugas ditetapkan', at: '10 Okt 2026, 13.10 WIB', note: 'Disepakati pemberi dan penerima' }],
    },
    {
      id: 'DEL-2026-079',
      transferId: 'LP-DEMO-04',
      food: 'Beras putih kemasan',
      agreed: 10,
      unit: 'kg',
      from: { name: 'Toko Berkah', pic: 'Sari Wulandari', address: 'Jl. Contoh No. 3, Sukasari', note: '' },
      to: { name: 'Panti Asuhan Harapan', pic: 'Pengurus panti', address: 'Jl. Contoh No. 21, Coblong', note: '' },
      window: '7 Okt 2026, 10.00–12.00 WIB',
      cost: 'Rp0 (relawan mandiri)',
      status: 'Selesai',
      picked: 10,
      delivered: 10,
      timeline: [
        { label: 'Diambil dari pemberi', at: '7 Okt 2026, 10.20 WIB', note: '10 kg' },
        { label: 'Diserahkan ke penerima', at: '7 Okt 2026, 11.05 WIB', note: '10 kg' },
      ],
    },
  ],
}

export type Action =
  | { type: 'hydrate'; data: Partial<LiveData> }
  | { type: 'signIn'; role?: Role }
  | { type: 'signOut' }
  | { type: 'onboarded' }
  | { type: 'setRole'; role: Role }
  | { type: 'publishOffer'; offer: Omit<Offer, 'id' | 'createdAt' | 'reserved' | 'handedOver' | 'available'>; recordId?: string }
  | { type: 'closeOffer'; id: string }
  | { type: 'submitRequest'; request: Omit<FoodRequest, 'id' | 'status' | 'createdAt'> }
  | { type: 'decideRequest'; id: string; decision: 'approve' | 'reject'; reason?: string }
  | { type: 'cancelRequest'; id: string; reason: string }
  | { type: 'handover'; id: string; quantity: number; note?: string }
  | { type: 'receive'; id: string; received: number; reason?: string; note?: string }
  | { type: 'reportDistribution'; id: string; distributed: number; used: number; wasted: number }
  | { type: 'addRecord'; record: Omit<FoodRecord, 'id'>; clientId?: string }
  | { type: 'readNotification'; id: string }
  | { type: 'readAllNotifications' }
  | { type: 'toggleTip'; id: string }
  | { type: 'proposeAdjustment'; id: string; quantity: number; reason: string }
  | { type: 'respondAdjustment'; id: string; accept: boolean }
  | { type: 'respondSchedule'; id: string; accept: boolean }
  | { type: 'reportIssue'; transferId: string; category: string; description: string; clientId?: string }
  | { type: 'objectIssue'; id: string; note: string }
  | { type: 'moveRecord'; id: string; kind: 'Digunakan' | 'Didistribusikan' | 'Terbuang'; quantity: number; note?: string; clientId?: string }
  | { type: 'correctRecord'; id: string; quantity: number; reason: string; clientId?: string }
  | { type: 'updateOffer'; id: string; changes: OfferChanges; reason?: string }
  | { type: 'saveProfile'; fields: Partial<ProfileFields> }
  | { type: 'setPref'; key: string; value: boolean }
  | { type: 'claimReward'; id: string; participant?: string }
  | { type: 'addSupport'; amount: number; allocation: string; fund?: 'operasional' | 'pengiriman'; clientId?: string }
  | { type: 'toggleRecipe'; id: string }
  | { type: 'joinChallenge'; id: string }
  | { type: 'finishChallenge'; id: string }
  | { type: 'setAppreciation'; value: State['appreciation']; note?: string; materialId?: number | null }
  | { type: 'setRecurring'; value: State['recurring'] }
  | { type: 'addInKind'; kind: string; amount: string; clientId?: string }
  | { type: 'setMethod'; id: string; method: Transfer['method'] }
  | { type: 'setPrep'; id: string; checks: string[] }
  | { type: 'taskPickup'; id: string; quantity: number }
  | { type: 'taskDeliver'; id: string; quantity: number }
  | { type: 'taskFail'; id: string; reason: string }
  | { type: 'reset' }

function notify(s: State, role: Role, title: string, body: string, to: string, cta: string): Notification {
  return { id: `N-${s.seq}-${s.notifications.length}`, role, title, body, at: nowLabel(), read: false, to, kind: 'Kegiatan', cta }
}

function reducer(s: State, a: Action): State {
  const at = nowLabel()
  switch (a.type) {
    case 'hydrate':
      return { ...s, ...a.data }
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
                timeline: [...t.timeline, { label: 'Diserahkan', at, by: t.donorName, note: `${a.quantity} ${t.unit} diserahkan${a.note ? `. ${a.note}` : ''}` }],
              }
            : t,
        ),
      }
    case 'receive': {
      const target = s.transfers.find((t) => t.id === a.id)
      const seq = s.seq + 1
      const record: FoodRecord | null =
        target && a.received > 0
          ? {
              id: `CP-${seq}`,
              owner: 'penerima',
              name: target.foodName,
              category: 'Makanan matang',
              quantity: a.received,
              unit: target.unit,
              estimate: false,
              date: at,
              storage: 'Posko penerima',
              status: 'Masih tersedia',
              source: `Diterima dari ${target.donorName} (${target.id})`,
            }
          : null
      return {
        ...s,
        seq: record ? seq : s.seq,
        records: record ? [record, ...s.records] : s.records,
        transfers: s.transfers.map((t) => {
          if (t.id !== a.id || (t.status !== 'Diserahkan' && t.status !== 'Terjadwal')) return t
          const base = t.handedOver ?? t.agreed
          const status: Transfer['status'] = a.received === 0 ? 'Ditolak' : a.received < base ? 'Diterima sebagian' : 'Diterima penuh'
          const note =
            status === 'Diterima penuh'
              ? `${a.received} ${t.unit} diterima`
              : `${a.received} ${t.unit} diterima, ${base - a.received} ${t.unit} tidak diterima${a.reason ? `: ${a.reason}` : ''}`
          return {
            ...t,
            status,
            handedOver: base,
            received: a.received,
            rejected: base - a.received,
            timeline: [...t.timeline, { label: status, at, by: t.recipientName, note: a.note ? `${note}. ${a.note}` : note }],
          }
        }),
      }
    }
    case 'reportDistribution':
      return {
        ...s,
        transfers: s.transfers.map((t) =>
          t.id === a.id
            ? {
                ...t,
                distributionReported: true,
                distribution: { distributed: a.distributed, used: a.used, wasted: a.wasted },
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
    case 'readAllNotifications':
      return { ...s, notifications: s.notifications.map((n) => (n.role === s.role ? { ...n, read: true } : n)) }
    case 'toggleTip':
      return {
        ...s,
        savedTips: s.savedTips.includes(a.id) ? s.savedTips.filter((t) => t !== a.id) : [...s.savedTips, a.id],
      }
    case 'proposeAdjustment': {
      const req = s.requests.find((r) => r.id === a.id)
      if (!req || req.status !== 'Diajukan') return s
      return {
        ...s,
        requests: s.requests.map((r) => (r.id === a.id ? { ...r, status: 'Menunggu penyesuaian', proposal: { quantity: a.quantity, reason: a.reason, at } } : r)),
        notifications: [notify(s, 'penerima', 'Pemberi mengusulkan penyesuaian', `Usulan ${a.quantity} ${req.unit} untuk permintaan ${req.id}.`, `/permintaan/${req.id}/penyesuaian`, 'Tinjau usulan'), ...s.notifications],
      }
    }
    case 'respondAdjustment': {
      const req = s.requests.find((r) => r.id === a.id)
      if (!req?.proposal || req.status !== 'Menunggu penyesuaian') return s
      if (!a.accept)
        return { ...s, requests: s.requests.map((r) => (r.id === a.id ? { ...r, status: 'Dibatalkan', reason: 'Penyesuaian jumlah tidak disetujui penerima.' } : r)) }
      // Menyetujui usulan = menyetujui permintaan dengan jumlah baru; kuota langsung dikunci.
      const adjusted = { ...s, requests: s.requests.map((r) => (r.id === a.id ? { ...r, quantity: req.proposal!.quantity, status: 'Diajukan' as const } : r)) }
      return reducer(adjusted, { type: 'decideRequest', id: a.id, decision: 'approve' })
    }
    case 'respondSchedule':
      return {
        ...s,
        transfers: s.transfers.map((t) => {
          if (t.id !== a.id || !t.pendingSchedule) return t
          const p = t.pendingSchedule
          const event = a.accept
            ? { label: 'Jadwal baru disetujui', at, by: t.recipientName, note: `${p.date}, ${p.timeStart}–${p.timeEnd} WIB` }
            : { label: 'Jadwal baru ditolak', at, by: t.recipientName, note: 'Kesepakatan jadwal lama tetap berlaku.' }
          return a.accept
            ? { ...t, date: p.date, timeStart: p.timeStart, timeEnd: p.timeEnd, pendingSchedule: undefined, timeline: [...t.timeline, event] }
            : { ...t, pendingSchedule: undefined, timeline: [...t.timeline, event] }
        }),
      }
    case 'reportIssue': {
      const seq = s.seq + 1
      const issue: Issue = {
        id: `ISS-${seq}`,
        transferId: a.transferId,
        role: s.role,
        category: a.category,
        description: a.description,
        status: 'Dikirim',
        at,
        timeline: [{ label: 'Laporan dikirim', at, by: s.role === 'pemberi' ? mock.DONOR.name : mock.RECIPIENT.name, note: a.category }],
      }
      return { ...s, seq, issues: [issue, ...s.issues] }
    }
    case 'objectIssue':
      return {
        ...s,
        issues: s.issues.map((i) =>
          i.id === a.id ? { ...i, status: 'Keberatan diajukan', timeline: [...i.timeline, { label: 'Keberatan diajukan', at, by: 'Anda', note: a.note }] } : i,
        ),
      }
    case 'moveRecord':
      return {
        ...s,
        records: s.records.map((r) => {
          if (r.id !== a.id || a.quantity <= 0 || a.quantity > r.quantity) return r
          const left = r.quantity - a.quantity
          return {
            ...r,
            quantity: left,
            // Status mengikuti pergerakan terakhir hanya bila saldo habis.
            status: left === 0 ? a.kind : r.status,
            history: [...(r.history ?? []), { label: a.kind, delta: -a.quantity, at, note: a.note, kind: 'keluar' as const }],
          }
        }),
      }
    case 'correctRecord':
      return {
        ...s,
        records: s.records.map((r) =>
          r.id === a.id && a.quantity >= 0
            ? {
                ...r,
                quantity: a.quantity,
                status: a.quantity > 0 && (r.status === 'Digunakan' || r.status === 'Didistribusikan' || r.status === 'Terbuang') ? 'Masih tersedia' : r.status,
                history: [...(r.history ?? []), { label: `Koreksi: ${a.reason}`, delta: a.quantity - r.quantity, at, kind: 'koreksi' as const, note: `${r.quantity} → ${a.quantity} ${r.unit}` }],
              }
            : r,
        ),
      }
    case 'updateOffer': {
      const old = s.offers.find((o) => o.id === a.id)
      if (!old) return s
      const c = a.changes
      const moved = c.pickupDate !== old.pickupDate || c.pickupStart !== old.pickupStart || c.pickupEnd !== old.pickupEnd
      // Jumlah awal ikut berubah agar tersedia + direservasi + diserahkan tetap konsisten.
      const initial = old.initial + (c.available - old.available)
      const affected = s.transfers.find((t) => t.offerId === a.id && t.status === 'Terjadwal')
      return {
        ...s,
        offers: s.offers.map((o) => (o.id === a.id ? { ...o, ...c, initial } : o)),
        transfers: moved
          ? s.transfers.map((t) =>
              t.offerId === a.id && t.status === 'Terjadwal'
                ? {
                    ...t,
                    pendingSchedule: { date: c.pickupDate, timeStart: c.pickupStart, timeEnd: c.pickupEnd, reason: a.reason },
                    timeline: [
                      ...t.timeline,
                      { label: 'Usulan jadwal baru', at, by: t.donorName, note: `${c.pickupStart}–${c.pickupEnd}. Menunggu persetujuan penerima${a.reason ? `. ${a.reason}` : ''}` },
                    ],
                  }
                : t,
            )
          : s.transfers,
        notifications: moved && affected
          ? [notify(s, 'penerima', 'Usulan jadwal baru', `${old.name}: ${c.pickupStart}–${c.pickupEnd} WIB. Kesepakatan lama berlaku sampai Anda setuju.`, `/aktivitas/${affected.id}`, 'Tinjau jadwal'), ...s.notifications]
          : s.notifications,
      }
    }
    case 'saveProfile':
      return { ...s, profileEdits: { ...s.profileEdits, [s.role]: { ...s.profileEdits[s.role], ...a.fields } } }
    case 'setPref':
      return { ...s, prefs: { ...s.prefs, [a.key]: a.value } }
    case 'claimReward':
      return { ...s, rewardClaim: a.id }
    case 'addSupport': {
      const seq = s.seq + 1
      return { ...s, seq, supports: [{ id: `DKG-${seq}`, amount: a.amount, allocation: a.allocation, at, status: 'Menunggu verifikasi' }, ...s.supports] }
    }
    case 'toggleRecipe':
      return { ...s, savedRecipes: s.savedRecipes.includes(a.id) ? s.savedRecipes.filter((x) => x !== a.id) : [...s.savedRecipes, a.id] }
    case 'joinChallenge':
      return s.joinedChallenges.includes(a.id) ? s : { ...s, joinedChallenges: [...s.joinedChallenges, a.id] }
    case 'finishChallenge':
      return s // mode demo: pemeriksaan tim tidak disimulasikan
    case 'setAppreciation':
      return { ...s, appreciation: a.value }
    case 'setRecurring':
      return { ...s, recurring: a.value }
    case 'addInKind': {
      const seq = s.seq + 1
      return { ...s, seq, inKind: [{ id: `INK-${seq}`, kind: a.kind, amount: a.amount, at, status: 'Menunggu peninjauan' }, ...s.inKind] }
    }
    case 'setMethod':
      return {
        ...s,
        transfers: s.transfers.map((t) =>
          t.id === a.id && t.status === 'Terjadwal' && t.method !== a.method
            ? { ...t, method: a.method, timeline: [...t.timeline, { label: 'Cara penyaluran diubah', at, by: s.role === 'pemberi' ? t.donorName : t.recipientName, note: `${t.method} → ${a.method}` }] }
            : t,
        ),
      }
    case 'setPrep':
      return { ...s, transfers: s.transfers.map((t) => (t.id === a.id ? { ...t, prep: a.checks } : t)) }
    case 'taskPickup':
      return {
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === a.id && t.status === 'Menunggu ambil'
            ? { ...t, status: 'Dalam perjalanan', picked: a.quantity, timeline: [...t.timeline, { label: 'Diambil dari pemberi', at, note: `${a.quantity} ${t.unit}` }] }
            : t,
        ),
      }
    case 'taskDeliver':
      return {
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === a.id && t.status === 'Dalam perjalanan'
            ? { ...t, status: 'Selesai', delivered: a.quantity, timeline: [...t.timeline, { label: 'Diserahkan ke penerima', at, note: `${a.quantity} ${t.unit}` }] }
            : t,
        ),
      }
    case 'taskFail':
      return {
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === a.id && (t.status === 'Menunggu ambil' || t.status === 'Dalam perjalanan')
            ? { ...t, status: 'Gagal', timeline: [...t.timeline, { label: 'Pengiriman gagal', at, note: a.reason }] }
            : t,
        ),
      }
    case 'reset':
      return { ...initial, signedIn: s.signedIn, onboarded: true, role: s.role }
  }
}

// Naikkan versi saat bentuk data demo berubah agar data lama di perangkat tidak bentrok.
const KEY = 'lestari-pangan-demo-v3'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // Data live tidak dipulihkan dari perangkat; selalu dimuat ulang dari server.
      if (isLive) for (const k of LIVE_KEYS) delete saved[k]
      return { ...initial, ...saved }
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
      const toSave: Partial<State> = { ...state }
      if (isLive) for (const k of LIVE_KEYS) delete toSave[k]
      localStorage.setItem(KEY, JSON.stringify(toSave))
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
