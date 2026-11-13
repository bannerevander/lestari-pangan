import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pause, Play } from '@phosphor-icons/react'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { cityOf } from '../lib/area'
import { reduceMotion } from './ui'
import type { Placement, Promotion } from '../services/promotions'

const AUTOPLAY_MS = 5000

/** Promosi aktif untuk satu penempatan dan peran pengguna; promosi berwilayah hanya tampil di kab/kota yang sama. */
export function PromoBanner({ placement, className = '' }: { placement: Placement; className?: string }) {
  const { state } = useApp()
  const city = cityOf(useProfile().area)
  const list = state.promotions.filter((p) => p.placement === placement && (p.audience === 'semua' || p.audience === state.role) && (!p.area || p.area === city))
  if (!list.length) return null
  return <Carousel items={list} className={className} />
}

/**
 * Isi satu banner 16:9: foto penuh + tulisan dari database di atasnya (tajam dan terbaca di HP).
 * Tanpa headline = gambar lama yang sudah berisi tulisan; ditampilkan apa adanya. Dipakai juga di pratinjau admin.
 */
export function PromoSlide({ p }: { p: Pick<Promotion, 'title' | 'image' | 'headline' | 'body' | 'cta'> }) {
  return (
    // Ukuran tulisan mengikuti lebar banner (cqw), jadi tidak pernah terpotong di HP kecil maupun di pratinjau admin.
    <div style={{ containerType: 'inline-size' }} className="relative aspect-[16/9] w-full overflow-hidden rounded-card bg-primary-container shadow-card">
      {p.image && <img src={p.image} alt={p.headline ? '' : p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      {p.headline && (
        <>
          {/* Gradasi hijau gelap dari kiri: tulisan putih tetap kontras di atas foto apa pun. */}
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,32,16,0.88)_0%,rgba(10,32,16,0.62)_42%,rgba(10,32,16,0)_78%)]" />
          <div className="relative flex h-full max-w-[74%] flex-col justify-center gap-[1.6cqw] p-[clamp(0.75rem,4.6cqw,1.5rem)]">
            <p className="line-clamp-2 text-[clamp(1rem,6.4cqw,1.75rem)] font-bold leading-[1.12] text-[#fff]">{p.headline}</p>
            {p.body && <p className="line-clamp-2 text-[clamp(0.6875rem,3.9cqw,1rem)] leading-snug text-[#fff]/90">{p.body}</p>}
            {p.cta && (
              <span className="mt-[1.2cqw] inline-flex min-h-[clamp(1.75rem,10cqw,2.5rem)] items-center gap-1.5 self-start rounded-full bg-[#fff] px-[clamp(0.75rem,4.2cqw,1.25rem)] text-[clamp(0.6875rem,3.8cqw,0.9375rem)] font-semibold text-primary shadow-card">
                {p.cta} <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Carousel: geser sendiri tiap 5 dtk, bisa di-swipe, berhenti saat disentuh/disorot/difokus atau dijeda. */
function Carousel({ items, className }: { items: Promotion[]; className: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [hold, setHold] = useState(false) // sedang disentuh/disorot/difokus
  const [paused, setPaused] = useState(() => reduceMotion())
  const resume = useRef<number>()
  const many = items.length > 1

  const go = (i: number) => {
    const el = track.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: reduceMotion() ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    if (!many || hold || paused) return
    const t = window.setInterval(() => {
      const el = track.current
      if (!el || document.hidden) return
      go((Math.round(el.scrollLeft / el.clientWidth) + 1) % items.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(t)
  }, [many, hold, paused, items.length])
  useEffect(() => () => window.clearTimeout(resume.current), [])

  // Setelah jari dilepas, tunggu sebentar sebelum bergeser lagi agar pengguna sempat membaca.
  const release = () => {
    window.clearTimeout(resume.current)
    resume.current = window.setTimeout(() => setHold(false), 4000)
  }

  return (
    <section aria-roledescription="carousel" aria-label="Promosi" className={className}>
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onPointerDown={() => setHold(true)}
        onPointerUp={release}
        onPointerCancel={release}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={() => setHold(false)}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p, i) => (
          <div key={p.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} dari ${items.length}`} className="w-full shrink-0 snap-center">
            {p.link ? (
              <Link to={p.link} aria-label={p.headline ? [p.headline, p.body, p.cta].filter(Boolean).join('. ') : p.title} className="tap tap-soft block rounded-card">
                <PromoSlide p={p} />
              </Link>
            ) : (
              <PromoSlide p={p} />
            )}
          </div>
        ))}
      </div>
      {many && (
        <div className="mt-2 flex items-center justify-center gap-1">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Banner ${i + 1} dari ${items.length}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="flex h-6 items-center px-0.5"
            >
              <span className={`block h-2 rounded-full transition-all duration-micro ${i === index ? 'w-5 bg-primary' : 'w-2 bg-line-control'}`} />
            </button>
          ))}
          <button
            type="button"
            aria-label={paused ? 'Putar banner otomatis' : 'Jeda banner otomatis'}
            onClick={() => setPaused((v) => !v)}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-ink-secondary hover:bg-page"
          >
            {paused ? <Play size={12} weight="fill" aria-hidden="true" /> : <Pause size={12} weight="fill" aria-hidden="true" />}
          </button>
        </div>
      )}
    </section>
  )
}
