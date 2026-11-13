import type { ReactNode } from 'react'
import { Sparkle } from '@phosphor-icons/react'

/** Gelembung jawaban asisten: ikon + isi. Dipakai untuk jawaban tersimpan dan jawaban yang sedang mengalir. */
export function AssistantBubble({ offTopic, children }: { offTopic?: boolean; children: ReactNode }) {
  return (
    <div className="flex max-w-[92%] animate-rise-in gap-2">
      <span aria-hidden="true" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
        <Sparkle size={16} weight="fill" />
      </span>
      <div className={`min-w-0 rounded-card rounded-tl-md border px-4 py-3 text-body ${offTopic ? 'border-info/30 bg-info-container' : 'border-line bg-surface'}`}>
        <span className="sr-only">Asisten: </span>
        {children}
      </div>
    </div>
  )
}
