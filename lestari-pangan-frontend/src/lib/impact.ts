import type { Transfer } from '../data/types.ts'
import { nowLabel } from './format.ts'

/** "13 Nov 2026": hari penerimaan dari riwayat kegiatan; jadwal penyerahan bila riwayat belum memuatnya. */
export const receivedOn = (t: Pick<Transfer, 'timeline' | 'date'>) =>
  [...t.timeline].reverse().find((e) => e.label.startsWith('Diterima'))?.at.split(',')[0] ?? t.date

/** Tujuh hari terakhir (termasuk hari ini); value null = tidak ada penerimaan terkonfirmasi hari itu. */
export function lastWeek(done: Pick<Transfer, 'timeline' | 'date' | 'received'>[], today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - 6 + i)
    const label = nowLabel(d).split(',')[0]
    const hits = done.filter((t) => receivedOn(t) === label)
    return { day: label.slice(0, label.lastIndexOf(' ')), value: hits.length ? hits.reduce((s, t) => s + (t.received ?? 0), 0) : null }
  })
}
