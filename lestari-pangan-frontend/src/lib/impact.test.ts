// Jalankan: npm run test:config
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lastWeek, receivedOn } from './impact.ts'

const ev = (label: string, at: string) => ({ label, at, by: 'x' })

test('hari penerimaan diambil dari riwayat, bukan jadwal', () => {
  const t = { date: '14 Nov 2026', timeline: [ev('Diserahkan', '13 Nov 2026, 15.36 WIB'), ev('Diterima penuh', '13 Nov 2026, 15.37 WIB')] }
  assert.equal(receivedOn(t), '13 Nov 2026')
  assert.equal(receivedOn({ date: '14 Nov 2026', timeline: [] }), '14 Nov 2026')
})

test('tujuh hari terakhir: jumlah per hari, null bila tanpa penerimaan', () => {
  const done = [
    { date: '14 Nov 2026', received: 10, timeline: [ev('Diterima penuh', '13 Nov 2026, 15.37 WIB')] },
    { date: '13 Nov 2026', received: 3, timeline: [ev('Diterima sebagian', '13 Nov 2026, 17.12 WIB')] },
    { date: '1 Nov 2026', received: 5, timeline: [ev('Diterima penuh', '1 Nov 2026, 09.00 WIB')] },
  ]
  const week = lastWeek(done, new Date(2026, 10, 13, 23, 0))
  assert.equal(week.length, 7)
  assert.deepEqual(week[0], { day: '7 Nov', value: null })
  assert.deepEqual(week[6], { day: '13 Nov', value: 13 })
  assert.equal(week.filter((d) => d.value !== null).length, 1)
})
