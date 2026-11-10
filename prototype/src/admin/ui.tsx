import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { Badge, Button, CountUp, Field, inputCls, RadioCard, toast, type Tone } from '../components/ui'
import { useAdmin } from './store'
import { messageOf } from '../lib/supabase/errors'

/** Komponen khusus konsol admin. Primitif dasar (Button, Badge, Field…) dipakai bersama dari components/ui. */

export function PageHeader({ title, desc, actions, back }: { title: string; desc?: string; actions?: ReactNode; back?: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <button type="button" onClick={() => navigate(back)} className="tap -ml-2 mb-1 inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
            <ArrowLeft size={16} weight="bold" aria-hidden="true" /> Kembali
          </button>
        )}
        <h1 className="text-page-title">{title}</h1>
        {desc && <p className="mt-1 max-w-[70ch] text-body text-ink-secondary">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, desc, actions, children, className = '' }: { title?: string; desc?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-4 md:p-5 ${className}`}>
      {title && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-card-title">{title}</h2>
            {desc && <p className="text-meta text-ink-secondary">{desc}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, unit, hint, to, cta, format }: { label: string; value: number; unit?: string; hint?: string; to?: string; cta?: string; format?: (n: number) => string }) {
  return (
    <div className="card flex min-w-0 flex-col p-4 md:p-5">
      <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[1.75rem] font-bold leading-9 text-ink md:text-[2rem] md:leading-10"><CountUp value={value} format={format} /></span>
        {unit && <span className="text-body text-ink-secondary">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-meta text-ink-secondary">{hint}</p>}
      {to && (
        <Link to={to} className="group mt-auto flex min-h-11 items-center justify-between gap-2 border-t border-line pt-3 text-[0.875rem] font-semibold text-primary">
          {cta}
          <ArrowRight size={16} weight="bold" aria-hidden="true" className="transition-transform duration-micro ease-standard group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}

/** Tabel data: menggulir horizontal di dalam kartu bila sempit, bukan seluruh halaman. */
export function Table({ head, children, label }: { head: string[]; children: ReactNode; label: string }) {
  return (
    <div className="-mx-4 overflow-x-auto md:-mx-5" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-y border-line bg-page">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-caption font-semibold uppercase tracking-wide text-ink-secondary first:pl-4 md:first:pl-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="stagger divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export const td = 'px-4 py-3 align-top text-meta first:pl-4 md:first:pl-5'

export function adminTone(status: string): Tone {
  if (/Terverifikasi|Selesai|Terbit|Aktif|Tervalidasi|Diserahkan|Disetujui|Valid|Siap disalurkan/.test(status)) return 'success'
  if (/Menunggu|Perlu|Sedang|Draf|Dalam/.test(status)) return 'warning'
  if (/Ditolak|Ditarik|Tidak valid/.test(status)) return 'danger'
  if (/Dicatat|Arsip/.test(status)) return 'neutral'
  return 'info'
}

export function Status({ status }: { status: string }) {
  return <Badge tone={adminTone(status)}>{status}</Badge>
}

export const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`

/**
 * Panel keputusan staf: pilih hasil, tulis alasan, simpan → status berubah dan
 * entri baru masuk log audit. Dipakai di verifikasi, kendala, capaian, dan klaim.
 */
export function DecisionPanel({
  target,
  current,
  options,
  title = 'Keputusan peninjau',
  onDone,
}: {
  target: string
  current: string
  options: { value: string; label: string; desc: string }[]
  title?: string
  onDone?: () => void
}) {
  const { decide } = useAdmin()
  const [choice, setChoice] = useState('')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = () => {
    if (!choice) return setErr('Pilih keputusan.')
    if (reason.trim().length < 10) return setErr('Tulis alasan minimal 10 karakter. Alasan tercatat di log audit.')
    setBusy(true)
    decide(target, current, choice, reason.trim())
      .then(() => {
        setChoice('')
        setReason('')
        toast(`${target}: ${choice}. Tercatat di riwayat perubahan.`)
        onDone?.()
      })
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setBusy(false))
  }
  return (
    <Panel title={title} desc={`Status saat ini: ${current}`}>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Pilihan keputusan</legend>
        {options.map((o) => (
          <RadioCard key={o.value} name={`d-${target}`} checked={choice === o.value} onChange={() => (setChoice(o.value), setErr(''))} title={o.label} description={o.desc} />
        ))}
      </fieldset>
      <div className="mt-4">
        <Field label="Alasan resmi" hint="Dicatat permanen di log audit beserta nilai sebelum dan sesudah." error={err}>
          {(p) => <textarea {...p} rows={3} className={inputCls} value={reason} onChange={(e) => (setReason(e.target.value), setErr(''))} />}
        </Field>
      </div>
      <Button block className="mt-4" loading={busy} loadingLabel="Menyimpan…" onClick={submit}>
        Simpan keputusan
      </Button>
    </Panel>
  )
}

/** Baris filter berupa tombol bertekan (aria-pressed). */
export function Filters<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`tap inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[0.875rem] font-semibold ${on ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink hover:border-line-control'}`}
          >
            {o.label}
            {o.count !== undefined && <span className={`rounded-full px-1.5 text-[0.75rem] leading-5 ${on ? 'bg-white text-primary' : 'bg-page text-ink-secondary'}`}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
