import type { Role } from './types'

/** Katalog challenge dan paket reward. Mode demo memakai daftar ini; mode live memuat dari Supabase. */

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
}

export const METRIC_UNIT: Record<ChallengeMetric, string> = {
  catat_pangan: 'hari',
  penawaran_alergen: 'penawaran',
  laporan_distribusi_24j: 'laporan',
  penyaluran_selesai: 'penyaluran',
}

export const CHALLENGES: Challenge[] = [
  { id: 'catat-3-hari', roles: ['pemberi', 'penerima'], title: 'Catat Pangan tiga hari', desc: 'Catat persediaan atau surplus pada 3 hari berbeda.', target: 3, unit: 'hari', period: '8–31 Okt 2026', metric: 'catat_pangan' },
  { id: 'label-donasi', roles: ['pemberi'], title: 'Label donasi lengkap', desc: 'Terbitkan 2 penawaran dengan informasi bahan atau alergen.', target: 2, unit: 'penawaran', period: '1–31 Okt 2026', metric: 'penawaran_alergen' },
  { id: 'lapor-distribusi', roles: ['penerima'], title: 'Lengkapi laporan distribusi', desc: 'Isi laporan penggunaan untuk 3 penerimaan.', target: 3, unit: 'laporan', period: '8–31 Okt 2026', metric: 'laporan_distribusi_24j' },
]

export const REWARD_PACKS: RewardPack[] = [
  { id: 'RW-BESEK', title: 'Paket wadah besek higienis', desc: '10 wadah besek bambu, kantong higienis pangan, dan label waktu masak.', sponsor: 'Mitra Peduli Pangan' },
  { id: 'RW-POKOK', title: 'Paket bahan pokok dapur komunitas', desc: 'Beras lokal 5 kg dan minyak nabati untuk dapur pengolahan komunitas.', sponsor: 'Sponsor Komunitas Bandung' },
]
