import type { AuditEntry } from './store'
import type { ChallengeMetric } from '../data/engagement'
import type { Promotion } from '../services/promotions'
import type { Ticket } from '../services/support'

/** Tipe data konsol admin (AD01–AD22). Data dimuat dari Supabase oleh services/admin.ts. */

export interface Org {
  id: string
  name: string
  email: string
  role: 'Pemberi' | 'Penerima'
  type: string
  area: string
  pic: string
  phone: string
  doc: string
  docMeta: string
  status: string
  submitted: string
  /** Mode live: berkas verifikasi terbaru (bucket privat) dan ID-nya untuk keputusan. */
  docPath?: string
  verificationId?: number
}

export interface Issue {
  id: string
  transferId: string
  food: string
  reporter: string
  reporterRole: string
  reported: string
  reportedRole: string
  category: 'Kondisi makanan' | 'Jumlah selisih' | 'Keterlambatan' | 'Logistik'
  summary: string
  age: string
  priority: 'Tinggi' | 'Sedang' | 'Rendah'
  status: string
  resolution?: string
  /** Foto kondisi dari pelapor (bucket privat); dibuka lewat tautan sementara. */
  photoPath?: string
  timeline?: { title: string; detail: string }[]
}

export interface Delivery {
  id: string
  transferId: string
  load: string
  from: string
  to: string
  method: 'Ambil sendiri' | 'Kurir bersponsor' | 'Antar pemberi'
  cost: number
  courier?: string
  status: string
  transferDbId?: number
}

export interface Content {
  id: string
  kind: 'Tips' | 'Resep'
  title: string
  category: string
  version: string
  updated: string
  author: string
  status: string
  points: string[]
  dbId?: number
  summary?: string
  body?: unknown
  photo?: string
}

export interface Challenge {
  id: string
  title: string
  period: string
  roles: string
  target: string
  participants: number
  status: 'Aktif' | 'Draf' | 'Arsip'
  dbId?: number
  description?: string
  periodStart?: string
  periodEnd?: string
  metric?: ChallengeMetric
  targetCount?: number
  points?: number
}

export interface RewardPack {
  id: string
  title: string
  detail: string
  sponsor: string
  quota: number
  claimed: number
  cost: number
  dbId?: number
}

export interface Claim {
  id: string
  org: string
  /** Poin yang dipakai, mis. "80 poin". */
  challenge: string
  pack: string
  at: string
  status: string
}

export interface Txn {
  id: string
  date: string
  kind: 'Masuk' | 'Keluar' | 'Barang'
  purpose: string
  source: string
  amount: number
  /** Untuk bantuan barang: jumlah fisik, tidak dikonversi ke rupiah. */
  goods?: string
  linked?: string
  status: string
  dbId?: number
}

export interface Program {
  id: string
  title: string
  sponsor: string
  period: string
  budget: number
  used: number
  portions: number
  transfers: number
  status: string
  dbId?: number
}

export interface OpOffer {
  id: string
  name: string
  donor: string
  area: string
  published: string
  deadline: string
  initial: number
  reserved: number
  available: number
  unit: string
  status: 'Aktif' | 'Selesai'
  requests: { id: string; org: string; asked: number; proposed?: number; time: string; method: string; status: string; transferId?: string }[]
}

/** Rantai satu penyaluran (AD06): penawaran → kesepakatan → pengambilan → penerimaan → pemanfaatan. */
export interface Chain {
  id: string
  dbId: number
  offerId: string
  status?: string
  /** Penerimaan sebagian/penolakan yang menunggu verifikasi staf ops (OD-03). */
  pendingReceipt?: { received: number; reason: string; base: number; unit: string }
  steps: { title: string; value: string; who: string; tone: string }[]
  ledger: string[][]
}

/** Keikutsertaan challenge yang diperiksa admin (AD14). */
export interface Participant {
  id: string
  dbId: number
  challenge: string
  title: string
  org: string
  profileId: number
  target: number
  progress: number
  unit: string
  status: string
}

export interface Material {
  id: number
  profileId: number
  org: string
  version: number
  caption: string
  status: string
  note?: string
}

/** Seluruh data konsol, dimuat services/admin.ts. */
export interface AdminData {
  orgs: Org[]
  issues: Issue[]
  deliveries: Delivery[]
  contents: Content[]
  challenges: Challenge[]
  participants: Participant[]
  rewardPacks: RewardPack[]
  claims: Claim[]
  txns: Txn[]
  programs: Program[]
  audit: AuditEntry[]
  opOffers: OpOffer[]
  chains: Record<string, Chain>
  couriers: { id: number; name: string }[]
  partners: { id: number; name: string; area: string }[]
  materials: Material[]
  /** Dampak fisik per satuan untuk laporan terbuka (AD21); satuan tidak pernah dijumlahkan silang. */
  impact: Record<string, { offered: number; received: number; rejected: number; distributed: number }>
  promotions: Promotion[]
  /** Tiket bantuan/penghapusan data beserta nama organisasi pengirim. */
  tickets: (Ticket & { dbId: number; org: string })[]
}

/** Sebelum data server termuat. */
export const emptyData: AdminData = {
  orgs: [], issues: [], deliveries: [], contents: [], challenges: [], participants: [], rewardPacks: [], claims: [], txns: [],
  programs: [], audit: [], opOffers: [], chains: {}, couriers: [], partners: [], materials: [], impact: {}, promotions: [], tickets: [],
}
