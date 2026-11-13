import { Link } from 'react-router-dom'
import { CaretRight, Coins } from '@phosphor-icons/react'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { asset } from '../lib/format'
import { progressOf } from './challengeProgress'

/**
 * Strip Eco Challenge di Beranda, tepat di bawah sapaan: pola strip dompet/poin (GoPay, Koin Shopee, Tokopoints)
 * agar poin dan challenge berjalan terlihat tanpa menggulir.
 */
export function EcoChallengeCard() {
  const { state } = useApp()
  const me = useProfile().name
  const mine = state.challenges.filter((c) => c.roles.includes(state.role))
  const current = mine.find((c) => state.challengeEntries[c.id]?.status === 'Berjalan')
  const open = mine.filter((c) => !state.joinedChallenges.includes(c.id)).length
  const done = current ? Math.min(progressOf(state, current, me), current.target) : 0

  return (
    <Link
      to={current ? `/tantangan/${current.id}/progres` : '/tantangan'}
      className="tap tap-soft block rounded-card border border-accent/60 bg-gradient-to-br from-accent-soft via-accent-soft to-surface p-4 shadow-card hover:border-accent"
    >
      <span className="flex items-center gap-3">
        <img src={asset('illustrations/medali-daun.svg')} alt="" className="h-12 w-12 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="whitespace-nowrap text-label uppercase tracking-wide text-accent-ink">Eco Challenge</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-label tabular shadow-card">
              <Coins size={16} weight="fill" aria-hidden="true" className="text-accent" /> {state.points} poin
            </span>
          </span>
          <span className="mt-0.5 block font-semibold leading-6">
            {current ? current.title : open ? `${open} challenge tersedia` : 'Pantau challenge Anda'}
          </span>
        </span>
      </span>
      {current ? (
        <span className="mt-3 block">
          <span className="flex justify-between text-meta">
            <span className="text-ink-secondary">Progres</span>
            <span className="font-semibold tabular">{done} dari {current.target} {current.unit}</span>
          </span>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label={`Progres ${current.title}`} aria-valuemin={0} aria-valuemax={current.target} aria-valuenow={done}>
            <span className="block h-full origin-left animate-grow-x rounded-full bg-primary" style={{ width: `${(done / current.target) * 100}%` }} />
          </span>
        </span>
      ) : (
        <span className="mt-2 flex items-center justify-between gap-2 text-meta">
          <span className="text-ink-secondary">Kumpulkan poin, tukar reward.</span>
          <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-primary">
            Mulai <CaretRight size={14} weight="bold" aria-hidden="true" />
          </span>
        </span>
      )}
    </Link>
  )
}
