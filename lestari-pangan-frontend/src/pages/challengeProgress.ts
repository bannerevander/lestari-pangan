import type { useApp } from '../state/AppState'
import type { Challenge } from '../data/engagement'

type State = ReturnType<typeof useApp>['state']

/** Progres challenge: dari server (v_challenge_progress) bila sudah ikut; sebelum ikut, perkiraan dari data akun dengan aturan yang sama. */
export function progressOf(s: State, c: Challenge, me: string): number {
  const live = s.challengeEntries[c.id]
  if (live) return live.progress
  switch (c.metric) {
    case 'catat_pangan':
      return new Set(s.records.filter((r) => r.owner === s.role && !r.source).map((r) => r.date.split(',')[0])).size
    case 'penawaran_alergen':
      return s.offers.filter((o) => o.donorName === me && o.allergens).length
    case 'laporan_distribusi_24j':
      return s.transfers.filter((t) => t.recipientName === me && t.distributionReported).length
    case 'penyaluran_selesai':
      return s.transfers.filter((t) => (t.donorName === me || t.recipientName === me) && (t.received ?? 0) > 0).length
  }
}
