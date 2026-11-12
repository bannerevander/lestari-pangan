import { Link } from 'react-router-dom'
import { Sparkle } from '@phosphor-icons/react'

/**
 * Pintu masuk Asisten Dapur AI di semua tab utama. Tombol mengambang berlabel, bukan tab ke-6
 * (navigasi bawah maksimal 5 item). Dirender di dalam portal BottomTabBar.
 */
export function AssistantFab() {
  return (
    <div className="pointer-events-none fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex w-full max-w-app -translate-x-1/2 justify-end px-4">
      <Link
        to="/asisten"
        className="tap pointer-events-auto inline-flex min-h-14 animate-pop items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-[1rem] font-semibold text-white shadow-overlay ring-4 ring-surface hover:bg-primary-pressed"
      >
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Sparkle size={18} weight="fill" />
        </span>
        Tanya AI
      </Link>
    </div>
  )
}
