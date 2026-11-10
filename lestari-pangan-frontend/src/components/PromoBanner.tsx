import { Link } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { cityOf } from '../lib/area'
import type { Placement, Promotion } from '../services/promotions'

/** Promosi aktif untuk satu penempatan; promosi berwilayah hanya tampil di kab/kota yang sama. */
export function PromoBanner({ placement, className = '' }: { placement: Placement; className?: string }) {
  const { state } = useApp()
  const city = cityOf(useProfile().area)
  const list = state.promotions.filter((p) => p.placement === placement && (!p.area || p.area === city))
  if (!list.length) return null
  return (
    <section aria-label="Promosi" className={`chip-row -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 ${className}`}>
      {list.map((p) => (
        <Slide key={p.id} p={p} single={list.length === 1} />
      ))}
    </section>
  )
}

function Slide({ p, single }: { p: Promotion; single: boolean }) {
  const img = <img src={p.image} alt={p.title} loading="lazy" className="aspect-[3/1] w-full rounded-card border border-line object-cover" />
  const cls = `${single ? 'w-full' : 'w-[88%]'} shrink-0 snap-start`
  return p.link ? (
    <Link to={p.link} className={`tap tap-soft ${cls}`}>
      {img}
    </Link>
  ) : (
    <div className={cls}>{img}</div>
  )
}
