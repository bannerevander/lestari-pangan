import { Link } from 'react-router-dom'
import { CaretRight, Clock, MapPin, SealCheck } from '@phosphor-icons/react'
import type { Offer } from '../data/types'
import { Badge, StatusBadge } from './ui'
import { FoodPhoto } from './FoodPhoto'

export function pickupLabel(o: Pick<Offer, 'pickupDate' | 'pickupStart' | 'pickupEnd'>) {
  return `${o.pickupDate}, ${o.pickupStart}–${o.pickupEnd} WIB`
}

/** Kartu ringkas dengan thumbnail (H01 penawaran aktif, D01). */
export function FoodCardCompact({ offer, to, extra }: { offer: Offer; to: string; extra?: React.ReactNode }) {
  return (
    <article className="card overflow-hidden">
      <Link to={to} className="tap flex gap-3 p-3 hover:bg-page">
        <FoodPhoto src={offer.photo} alt={offer.name} className="h-20 w-20 shrink-0 rounded-control" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={offer.status} />
            <span className="text-caption text-ink-secondary">#{offer.id}</span>
          </div>
          <h3 className="text-card-title">{offer.name}</h3>
          <p className="text-[1rem] font-semibold leading-6 text-primary">
            {offer.available} {offer.unit} tersedia
            {offer.initial !== offer.available && (
              <span className="text-meta font-normal text-ink-secondary"> dari {offer.initial} {offer.unit} awal</span>
            )}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-meta text-ink-secondary">
            <Clock size={18} aria-hidden="true" className="mt-px shrink-0" />
            {pickupLabel(offer)}
          </p>
          <p className="flex items-start gap-1.5 text-meta text-ink-secondary">
            <MapPin size={18} aria-hidden="true" className="mt-px shrink-0" />
            {offer.area}
          </p>
        </div>
      </Link>
      {extra}
    </article>
  )
}

/** Kartu hasil pencarian penerima dengan foto besar (D06). */
export function FoodCardSearch({ offer }: { offer: Offer }) {
  return (
    <article className="card overflow-hidden">
      <Link to={`/donasi/${offer.id}`} className="tap block hover:bg-page" aria-label={`${offer.name}, ${offer.available} ${offer.unit} tersedia`}>
        <div className="relative">
          <FoodPhoto src={offer.photo} alt="" className="aspect-[16/9] w-full" iconSize={48} />
          <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-2">
            <Badge tone="success">Tersedia</Badge>
            <span className="rounded-full bg-surface px-2.5 py-1 text-[0.8125rem] font-semibold leading-[1.125rem] text-ink">{offer.category}</span>
          </div>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-1 text-meta text-ink-secondary">
            {offer.donorVerified && <SealCheck size={18} weight="fill" className="text-primary" aria-label="Identitas terverifikasi" />}
            {offer.donorName}
          </p>
          <h3 className="text-card-title">{offer.name}</h3>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 rounded-control border border-line bg-page px-3 py-2">
            <p>
              <span className="text-[1.125rem] font-bold text-primary">
                {offer.available} {offer.unit}
              </span>{' '}
              <span className="text-meta text-ink-secondary">tersedia</span>
            </p>
            {offer.reserved > 0 && (
              <p className="text-meta text-ink-secondary">
                {offer.reserved} direservasi dari {offer.initial}
              </p>
            )}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-meta text-ink-secondary">
            <Clock size={18} aria-hidden="true" className="mt-px shrink-0" />
            {pickupLabel(offer)}
          </p>
          <p className="flex items-start gap-1.5 text-meta text-ink-secondary">
            <MapPin size={18} aria-hidden="true" className="mt-px shrink-0" />
            {offer.area}
          </p>
          <span className="mt-3 flex min-h-12 items-center justify-center gap-1 rounded-control border border-primary text-[1rem] font-semibold text-primary">
            Lihat detail pangan <CaretRight size={18} weight="bold" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
