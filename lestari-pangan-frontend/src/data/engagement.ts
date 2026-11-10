import type { Role } from './types'

/** Tipe challenge dan paket reward (dimuat dari Supabase, services/engagement.ts). */

export type ChallengeMetric = 'catat_pangan' | 'penawaran_alergen' | 'laporan_distribusi_24j' | 'penyaluran_selesai'

export interface Challenge {
  id: string
  roles: Role[]
  title: string
  desc: string
  target: number
  unit: string
  period: string
  metric: ChallengeMetric
  /** Poin yang diberikan setelah capaian lolos pemeriksaan. */
  points: number
}

/** Keikutsertaan akun ini; progres dihitung server dari kegiatan (v_challenge_progress). */
export interface ChallengeEntry {
  participant: string
  status: 'Berjalan' | 'Menunggu verifikasi' | 'Lolos' | 'Tidak lolos'
  progress: number
}

export interface RewardPack {
  id: string
  title: string
  desc: string
  sponsor: string
  /** Poin yang ditukar untuk paket ini. */
  cost: number
}

export const METRIC_UNIT: Record<ChallengeMetric, string> = {
  catat_pangan: 'hari',
  penawaran_alergen: 'penawaran',
  laporan_distribusi_24j: 'laporan',
  penyaluran_selesai: 'penyaluran',
}
