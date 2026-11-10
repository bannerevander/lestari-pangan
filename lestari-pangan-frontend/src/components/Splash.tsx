import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { reduceMotion } from './ui'
import { asset } from '../lib/format'
import { useApp } from '../state/AppState'

/**
 * U01 Layar pembuka — "tunas tumbuh, lalu brand terungkap".
 *
 * Primer   : tiga helai daun mekar dari pangkal batang secara bergiliran (kiri → kanan → atas).
 * Sekunder : bayangan tanah melebar, wordmark naik dari balik garis, kilau sekali lewat.
 * Ambien   : cahaya hijau lembut yang bernapas di belakang logo.
 * Keluar   : komposisi sedikit membesar lalu memudar (lebih cepat dari masuk).
 *
 * Tampil sekali per sesi, bisa dilewati dengan ketuk/klik/tombol apa pun,
 * dan dilewati sepenuhnya bila pengguna memilih kurangi gerakan.
 * Helai daun dibuat dari logo-mark.png lewat scripts/pisah-daun.py.
 */

const HOLD_MS = 1600 // koreografi masuk selesai ±1,1 dtk; sisa waktu untuk membaca nama
const EXIT_MS = 440

let shownThisSession = false

const LEAVES: { src: string; rotate: number; delay: number }[] = [
  { src: 'img/leaf-1.png', rotate: 22, delay: 60 }, // kiri: terlipat ke arah batang
  { src: 'img/leaf-3.png', rotate: -24, delay: 150 }, // kanan
  { src: 'img/leaf-2.png', rotate: -12, delay: 240 }, // atas, helai utama paling akhir
]

export function Splash() {
  const { state } = useApp()
  // Preferensi di aplikasi dibaca langsung: atribut data-reduce-motion baru dipasang setelah render pertama.
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>(() => (shownThisSession || state.prefs.reduceMotion || reduceMotion() ? 'gone' : 'in'))

  useEffect(() => {
    if (phase !== 'in') return
    shownThisSession = true
    const t = window.setTimeout(() => setPhase('out'), HOLD_MS)
    const skip = () => setPhase('out')
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'out') return
    const t = window.setTimeout(() => setPhase('gone'), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'gone') return null
  const mark = asset('img/logo-mark.png')
  return createPortal(
    // Dekoratif: konten aplikasi di belakangnya sudah dimuat dan bisa dibaca pembaca layar.
    <div aria-hidden="true" className="splash fixed inset-0 z-[80] flex items-center justify-center bg-surface" data-out={phase === 'out' || undefined}>
      <div className="splash-stage flex flex-col items-center">
        <div className="relative h-[132px] w-[132px]">
          <span className="splash-glow absolute -inset-10 rounded-full" />
          <span className="splash-ground absolute -bottom-1 left-[22%] h-2.5 w-[36%] rounded-full" />
          {LEAVES.map((l) => (
            <img
              key={l.src}
              src={asset(l.src)}
              alt=""
              width={132}
              height={132}
              className="splash-leaf absolute inset-0 h-full w-full"
              style={{ '--r': `${l.rotate}deg`, '--d': `${l.delay}ms` } as CSSProperties}
            />
          ))}
          <span className="splash-sheen absolute inset-0" style={{ WebkitMaskImage: `url(${mark})`, maskImage: `url(${mark})` }} />
        </div>
        <p className="splash-line mt-6 overflow-hidden text-[1.75rem] font-bold leading-9 tracking-tight text-primary-pressed">
          <span style={{ '--d': '480ms' } as CSSProperties}>Lestari Pangan</span>
        </p>
      </div>
    </div>,
    document.body,
  )
}
