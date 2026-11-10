import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

const STEPS = ['Akun', 'Konfirmasi', 'Peran', 'Profil']

/** Kerangka layar pendaftaran: tombol kembali, progres langkah (bila ada), judul. */
export function SignupShell({ step, title, desc, children, back }: { step?: number; title: string; desc?: string; children: ReactNode; back?: () => void }) {
  const navigate = useNavigate()
  return (
    <main className="flex min-h-screen flex-col bg-surface pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
      <div className="flex min-h-14 items-center gap-1 px-1">
        <button type="button" aria-label="Kembali" onClick={back ?? (() => navigate(-1))} className="tap flex h-12 w-12 items-center justify-center rounded-full hover:bg-page">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        {step && (
          <p className="flex-1 text-meta text-ink-secondary">
            Langkah {step} dari {STEPS.length} · <span className="font-semibold text-ink">{STEPS[step - 1]}</span>
          </p>
        )}
      </div>
      {step && (
        <div className="flex gap-1.5 px-6" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className={`block h-full origin-left rounded-full bg-primary transition-transform duration-page ease-enter ${i < step ? 'scale-x-100' : 'scale-x-0'}`} />
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <h1 className="text-page-title">{title}</h1>
        {desc && <p className="mt-1 text-body text-ink-secondary">{desc}</p>}
        <div className="mt-6 flex flex-1 flex-col">{children}</div>
      </div>
    </main>
  )
}
