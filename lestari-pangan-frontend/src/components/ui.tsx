import { useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Check,
  CheckCircle,
  CircleNotch,
  ImageSquare,
  Minus,
  Plus,
  ShieldCheck,
  Clock,
  Info,
  Package,
  Prohibit,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react'

/* ---------- Tombol ---------- */

type BtnVariant = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger' | 'ghost-danger'

const btnBase =
  'tap inline-flex min-h-[52px] items-center justify-center gap-2 rounded-control px-4 py-2 text-center text-[1rem] font-semibold leading-6 disabled:cursor-not-allowed disabled:active:scale-100'
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-pressed active:bg-primary-pressed disabled:bg-disabled-bg disabled:text-disabled-fg',
  secondary: 'border border-line-control bg-surface text-ink hover:bg-page active:bg-primary-container disabled:text-disabled-fg',
  tonal: 'bg-primary-container text-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-disabled-bg disabled:text-disabled-fg',
  ghost: 'text-primary hover:bg-primary-container disabled:text-disabled-fg disabled:hover:bg-transparent',
  danger: 'border border-danger bg-surface text-danger hover:bg-danger-container disabled:border-line disabled:text-disabled-fg',
  // Aksi destruktif sekunder (batalkan, hentikan) tanpa bingkai.
  'ghost-danger': 'text-danger hover:bg-danger-container disabled:text-disabled-fg disabled:hover:bg-transparent',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  loading?: boolean
  loadingLabel?: string
  icon?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'primary',
  loading,
  loadingLabel = 'Mengirim…',
  icon,
  block,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${btnBase} ${btnVariants[variant]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading ? <CircleNotch size={20} weight="bold" aria-hidden="true" className="animate-spin" /> : icon && <span aria-hidden="true">{icon}</span>}
      {loading ? loadingLabel : children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  icon,
  block,
  className = '',
  children,
}: {
  to: string
  variant?: BtnVariant
  icon?: ReactNode
  block?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={`${btnBase} ${btnVariants[variant]} ${block ? 'w-full' : ''} ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </Link>
  )
}

/* ---------- App bar halaman detail ---------- */

/** true setelah halaman digulir melewati `offset` px (untuk elevasi header). */
export function useScrolled(offset = 4) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > offset)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [offset])
  return scrolled
}

/**
 * App bar halaman detail. `dirty` = ada isian yang belum disimpan: tombol kembali meminta
 * konfirmasi dan menutup/muat ulang tab memunculkan peringatan browser.
 */
export function AppBar({ title, actions, back = true, dirty = false }: { title: string; actions?: ReactNode; back?: boolean | string; dirty?: boolean }) {
  const navigate = useNavigate()
  const scrolled = useScrolled()
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const leave = () => (typeof back === 'string' ? navigate(back) : navigate(-1))
  return (
    <header
      className={`sticky top-0 z-30 flex min-h-14 items-center gap-1 border-b bg-surface/95 px-1 backdrop-blur transition-[box-shadow,border-color] duration-micro ease-standard ${
        scrolled ? 'border-line shadow-card' : 'border-transparent'
      }`}
    >
      {back && (
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => (dirty ? setConfirm(true) : leave())}
          className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink hover:bg-page"
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
      )}
      <h1 className={`min-w-0 flex-1 py-3 text-[1.125rem] font-semibold leading-[1.625rem] ${back ? '' : 'pl-3'}`}>{title}</h1>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
      <BottomSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Buang perubahan?"
        footer={
          <div className="flex flex-col gap-2">
            <Button variant="danger" block onClick={() => (setConfirm(false), leave())}>Buang dan keluar</Button>
            <Button variant="ghost" block onClick={() => setConfirm(false)}>Lanjut mengisi</Button>
          </div>
        }
      >
        <p className="text-body text-ink-secondary">Isian di halaman ini belum disimpan dan akan hilang.</p>
      </BottomSheet>
    </header>
  )
}

export function IconButton({ label, children, onClick, badge }: { label: string; children: ReactNode; onClick?: () => void; badge?: number }) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label}, ${badge} belum dibaca` : label}
      onClick={onClick}
      className="tap relative flex h-12 w-12 items-center justify-center rounded-full text-ink hover:bg-page"
    >
      {children}
      {!!badge && (
        <span aria-hidden="true" className="absolute right-2 top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[0.6875rem] font-bold leading-none text-white ring-2 ring-white">
          {badge}
        </span>
      )}
    </button>
  )
}

/* ---------- Status ---------- */

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'

const toneCls: Record<Tone, string> = {
  success: 'bg-primary-container text-primary',
  warning: 'bg-warning-container text-warning',
  danger: 'bg-danger-container text-danger',
  info: 'bg-info-container text-info',
  neutral: 'bg-neutral-soft text-ink-secondary',
  accent: 'bg-accent-soft text-ink',
}

const toneIcon: Record<Tone, ReactNode> = {
  success: <CheckCircle size={16} weight="fill" />,
  warning: <WarningCircle size={16} weight="fill" />,
  danger: <Prohibit size={16} weight="bold" />,
  info: <Clock size={16} weight="bold" />,
  neutral: <Package size={16} />,
  accent: <Info size={16} />,
}

export function Badge({ tone = 'neutral', children, icon = true }: { tone?: Tone; children: ReactNode; icon?: boolean }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold leading-[1.125rem] ${toneCls[tone]}`}>
      {icon && <span aria-hidden="true" className="shrink-0">{toneIcon[tone]}</span>}
      <span className="min-w-0">{children}</span>
    </span>
  )
}

/** Kamus status design.md §21.2 → tone. */
export function statusTone(status: string): Tone {
  switch (status) {
    case 'Tersedia':
    case 'Disetujui':
    case 'Diterima penuh':
    case 'Selesai dilaporkan':
    case 'Terverifikasi':
      return 'success'
    case 'Menunggu penyesuaian':
    case 'Diterima sebagian':
    case 'Menunggu pemeriksaan':
      return 'warning'
    case 'Ditolak':
      return 'danger'
    case 'Diajukan':
    case 'Terjadwal':
    case 'Diserahkan':
      return 'info'
    default:
      return 'neutral'
  }
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}

/* ---------- Banner informasi ---------- */

export function Notice({ tone = 'info', title, children }: { tone?: Exclude<Tone, 'neutral' | 'accent'>; title?: string; children: ReactNode }) {
  const Icon = tone === 'warning' ? Warning : tone === 'danger' ? WarningCircle : tone === 'success' ? CheckCircle : Info
  return (
    <div role={tone === 'danger' ? 'alert' : undefined} className={`flex gap-3 rounded-control p-3 ${toneCls[tone]}`}>
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" weight="bold" />
      <div className="min-w-0 text-[0.875rem] leading-5">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5 text-ink' : 'text-ink'}>{children}</div>
      </div>
    </div>
  )
}

/* ---------- Struktur ---------- */

export function SectionHeader({ title, to, linkLabel = 'Lihat semua', id }: { title: string; to?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2">
      <h2 id={id} className="text-section-title">{title}</h2>
      {to && (
        <Link to={to} className="tap -mr-2 inline-flex min-h-12 items-center gap-1 rounded-control px-2 text-[0.875rem] font-semibold leading-5 text-primary hover:bg-primary-container">
          {linkLabel}
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
      <dt className="text-meta text-ink-secondary">{label}</dt>
      <dd className="text-body text-ink">{children}</dd>
    </div>
  )
}

export function MenuRow({ to, icon, title, subtitle }: { to: string; icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <Link to={to} className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-page">
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium">{title}</span>
        {subtitle && <span className="block text-meta text-ink-secondary">{subtitle}</span>}
      </span>
      <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
    </Link>
  )
}

export function StatePanel({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-8 text-center">
      {icon && <div aria-hidden="true">{icon}</div>}
      <h2 className="text-card-title">{title}</h2>
      {children && <div className="text-body text-ink-secondary">{children}</div>}
      {action}
    </div>
  )
}

/** Segmented tab bergaya Stitch (D01/L01): kontainer abu dengan pil hijau aktif. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
  label: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // Pil hijau bergeser ke tab aktif; posisi diukur ulang saat ukuran berubah (teks besar membuat tab membungkus).
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLElement>('[aria-selected="true"]')
      if (el) setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrap.current) ro.observe(wrap.current)
    return () => ro.disconnect()
  }, [value])
  return (
    <div ref={wrap} role="tablist" aria-label={label} className="relative flex flex-wrap gap-1 rounded-control border border-line bg-neutral-soft p-1">
      {pill && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 rounded-[10px] bg-primary shadow-card transition-[transform,width,height] duration-enter ease-enter"
          style={{ transform: `translate(${pill.x}px, ${pill.y}px)`, width: pill.w, height: pill.h }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`tap relative flex min-h-11 min-w-[6rem] flex-auto flex-wrap items-center justify-center gap-1.5 rounded-[10px] px-1.5 text-[0.875rem] font-semibold leading-5 ${
              active ? `text-white ${pill ? '' : 'bg-primary'}` : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <span>{o.label}</span>
            {o.count !== undefined && (
              <span className={`min-w-5 rounded-full px-1.5 text-[0.75rem] leading-5 transition-colors duration-micro ${active ? 'bg-white text-primary' : 'bg-surface text-ink-secondary'}`}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`tap inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[0.875rem] font-semibold leading-5 ${
        selected ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink hover:border-line-control'
      }`}
    >
      {selected && <CheckCircle size={16} weight="fill" aria-hidden="true" className="animate-pop" />}
      {children}
    </button>
  )
}

let chipPeekDone = false
export const reduceMotion = () => 'reduceMotion' in document.documentElement.dataset || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Baris chip geser horizontal: tepi memudar saat ada chip tersembunyi, chip terpilih
 * bergeser ke tengah, roda mouse ikut menggeser, dan sekali per sesi baris "mengintip".
 */
export function ChipRow({ className = '', children, ...rest }: { className?: string; children: ReactNode; role?: string; 'aria-label'?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    // Roda mouse vertikal → geser horizontal, kecuali baris sudah di ujung (halaman tetap bisa digulir).
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const atEnd = e.deltaY > 0 ? el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 : el.scrollLeft <= 0
      if (atEnd) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    let t1 = 0
    let t2 = 0
    if (!chipPeekDone && !reduceMotion() && el.scrollWidth > el.clientWidth) {
      // Snap dimatikan sementara agar intipan tidak tertarik ke chip berikutnya.
      t1 = window.setTimeout(() => {
        chipPeekDone = true
        el.style.scrollSnapType = 'none'
        el.scrollTo({ left: 48, behavior: 'smooth' })
      }, 700)
      t2 = window.setTimeout(() => {
        el.scrollTo({ left: 0, behavior: 'smooth' })
        window.setTimeout(() => (el.style.scrollSnapType = ''), 500)
      }, 1150)
    }
    return () => {
      el.removeEventListener('scroll', update)
      el.removeEventListener('wheel', onWheel)
      ro.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  return (
    <div
      ref={ref}
      {...rest}
      data-fade-start={edges.start || undefined}
      data-fade-end={edges.end || undefined}
      onClick={(e) =>
        (e.target as HTMLElement).closest('button')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
      }
      className={`chip-row stagger ${className}`}
    >
      {children}
    </div>
  )
}

/* ---------- Formulir ---------- */

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label">
        {label}
        {optional && <span className="font-normal text-ink-secondary"> (opsional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-meta text-ink-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-start gap-1 text-meta font-medium text-danger">
          <WarningCircle size={18} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export const inputCls =
  'w-full min-h-[52px] rounded-control border border-line-control bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-danger'

/* ---------- Sheet ---------- */

export function BottomSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<Element | null>(null)
  // Tetap terpasang selama animasi keluar (lebih singkat dari masuk), lalu dilepas.
  const [mounted, setMounted] = useState(open)
  const last = useRef({ children, footer, title })
  if (open) last.current = { children, footer, title }
  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open || !mounted) return
    const t = window.setTimeout(() => setMounted(false), reduceMotion() ? 0 : 200)
    return () => window.clearTimeout(t)
  }, [open, mounted])
  useEffect(() => {
    if (!open) return
    trigger.current = document.activeElement
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      ;(trigger.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose])
  if (!mounted) return null
  // Saat menutup, isi terakhir tetap tampil agar sheet tidak kosong ketika meluncur turun.
  const view = last.current
  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-end justify-center ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-[rgba(18,33,43,0.40)] ${open ? 'animate-fade-in' : 'animate-fade-out'}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={view.title}
        tabIndex={-1}
        className={`relative flex max-h-[88vh] w-full max-w-app flex-col rounded-t-sheet bg-surface shadow-overlay focus:outline-none ${open ? 'animate-sheet-in' : 'animate-sheet-out'}`}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <h2 className="flex-1 text-card-title">{view.title}</h2>
          <IconButton label="Tutup" onClick={onClose}>
            <X size={22} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-4 py-4">{view.children}</div>
        {view.footer && <div className="border-t border-line px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3">{view.footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Area CTA bawah yang menempel (detail/formulir; bottom tab disembunyikan). */
export function StickyFooter({ children }: { children: ReactNode }) {
  return createPortal(
    <div role="region" aria-label="Tindakan utama" className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-app -translate-x-1/2 animate-footer-in flex-col gap-2 border-t border-line bg-surface/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 shadow-nav backdrop-blur">
      {children}
    </div>,
    document.body,
  )
}

/* ---------- Pola tambahan dari ekspor Stitch 2026-10-09 ---------- */

/** Kartu pilihan radio dengan judul dan penjelasan (L06, L10, Q06, D05). */
export function RadioCard({
  name,
  checked,
  onChange,
  title,
  description,
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: string
  description?: string
}) {
  return (
    <label
      className={`tap flex min-h-14 cursor-pointer items-start gap-3 rounded-control border p-3 ${
        checked ? 'border-primary bg-primary-container' : 'border-line bg-surface hover:border-line-control'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
      <span className="min-w-0">
        <span className="block font-semibold leading-6">{title}</span>
        {description && <span className="block text-meta text-ink-secondary">{description}</span>}
      </span>
    </label>
  )
}

/** Input jumlah dengan tombol kurang/tambah (L05). */
export function QtyStepper({
  id,
  value,
  onChange,
  min = 0,
  max,
  unit,
  describedBy,
}: {
  id: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  unit: string
  describedBy?: string
}) {
  const clamp = (n: number) => Math.max(min, max !== undefined ? Math.min(max, n) : n)
  const btn = 'tap flex h-12 w-12 shrink-0 items-center justify-center rounded-control text-primary hover:bg-primary-container disabled:text-disabled-fg disabled:hover:bg-transparent'
  return (
    <div className="flex items-center gap-1 rounded-control border border-line-control bg-surface p-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <button type="button" className={btn} aria-label={`Kurangi 1 ${unit}`} disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Minus size={22} weight="bold" aria-hidden="true" />
      </button>
      <input
        id={id}
        inputMode="numeric"
        aria-describedby={describedBy}
        className="h-12 min-w-0 flex-1 bg-transparent text-center text-[1.25rem] font-bold focus:outline-none"
        value={String(value)}
        onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, '') || 0)))}
      />
      <button type="button" className={btn} aria-label={`Tambah 1 ${unit}`} disabled={max !== undefined && value >= max} onClick={() => onChange(clamp(value + 1))}>
        <Plus size={22} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}

/** Baris pemberi → penerima (L02, L05, L06). */
export function PartiesRow({ donor, recipient }: { donor: string; recipient: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-control bg-info-container/60 p-3">
      <div className="min-w-0">
        <p className="text-caption text-ink-secondary">Pemberi</p>
        <p className="font-semibold leading-6">{donor}</p>
      </div>
      <ArrowRight size={18} aria-label="kepada" className="text-ink-secondary" />
      <div className="min-w-0 text-right">
        <p className="text-caption text-ink-secondary">Penerima</p>
        <p className="font-semibold leading-6">{recipient}</p>
      </div>
    </div>
  )
}

/** Kartu prinsip pelaporan tanpa sanksi (L06, L10, Q06, C06). */
export function PolicyNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="flex gap-3 rounded-card border border-primary/20 bg-primary-container/60 p-4">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
        <ShieldCheck size={20} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-primary">{title}</p>
        <p className="mt-0.5 text-meta text-ink">{children}</p>
      </div>
    </aside>
  )
}

/** Langkah tahapan vertikal (L02, Q02). */
export function StageList({ stages, current, label }: { stages: { title: string; detail?: string }[]; current: number; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {stages.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0" aria-current={active ? 'step' : undefined}>
            {i < stages.length - 1 && (
              <span aria-hidden="true" className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${done ? 'bg-primary' : 'bg-line'}`} />
            )}
            <span
              aria-hidden="true"
              className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold ${
                done ? 'bg-primary text-white' : active ? 'border-2 border-primary bg-surface text-primary' : 'border-2 border-line bg-surface text-ink-secondary'
              }`}
            >
              {done ? <Check size={14} weight="bold" /> : i + 1}
            </span>
            <div className={`min-w-0 flex-1 ${active ? 'rounded-control bg-primary-container px-3 py-2' : 'pt-0.5'}`}>
              <p className={`leading-6 ${done || active ? 'font-semibold text-ink' : 'text-ink-secondary'}`}>
                {s.title}
                <span className="sr-only">{done ? ' (selesai)' : active ? ' (sedang berlangsung)' : ' (belum)'}</span>
              </p>
              {s.detail && <p className="text-meta text-ink-secondary">{s.detail}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Kartu unggah foto yang belum aktif di prototipe. */
export function PhotoUploadPlaceholder({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-control border-2 border-dashed border-line bg-page px-4 py-6 text-center">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary">
        <ImageSquare size={22} />
      </span>
      <p className="font-semibold">{label}</p>
      <p className="text-caption text-ink-secondary">{hint}</p>
    </div>
  )
}

/* ---------- Motion dan umpan balik (tahap 2) ---------- */

/** Toast global: panggil toast('…') dari mana saja; <Toaster /> dipasang sekali di AppFrame. */
type ToastMsg = { id: number; text: string; tone: 'success' | 'info' }
const TOAST_EVENT = 'lp-toast'
let toastSeq = 0
export function toast(text: string, tone: ToastMsg['tone'] = 'success') {
  window.dispatchEvent(new CustomEvent<ToastMsg>(TOAST_EVENT, { detail: { id: ++toastSeq, text, tone } }))
}

export function Toaster() {
  const [msg, setMsg] = useState<ToastMsg | null>(null)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    let t1 = 0
    let t2 = 0
    const on = (e: Event) => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      setLeaving(false)
      setMsg((e as CustomEvent<ToastMsg>).detail)
      t1 = window.setTimeout(() => setLeaving(true), 3600)
      t2 = window.setTimeout(() => setMsg(null), 3800)
    }
    window.addEventListener(TOAST_EVENT, on)
    return () => {
      window.removeEventListener(TOAST_EVENT, on)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])
  // Wadah live selalu ada agar pembaca layar mengumumkan pesan tanpa memindahkan fokus.
  return createPortal(
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom,0px))] z-[60] flex justify-center px-4">
      {msg && (
        <div
          key={msg.id}
          className={`pointer-events-auto flex w-full max-w-[448px] items-center gap-3 rounded-card bg-ink px-4 py-3 text-white shadow-overlay ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
        >
          {msg.tone === 'success' ? (
            <CheckCircle size={22} weight="fill" aria-hidden="true" className="shrink-0 animate-pop text-leaf" />
          ) : (
            <Info size={22} weight="fill" aria-hidden="true" className="shrink-0 text-on-ink-info" />
          )}
          <p className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-5">{msg.text}</p>
        </div>
      )}
    </div>,
    document.body,
  )
}

/** Sakelar aksesibel (role="switch") dengan kenop yang "mendarat" memakai kurva pegas. */
export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p id={`${id}-l`} className="font-medium leading-6">{label}</p>
        {description && <p id={`${id}-d`} className="text-meta text-ink-secondary">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className="tap -m-2 flex h-12 w-[68px] shrink-0 items-center justify-center rounded-full"
      >
        <span className={`relative h-8 w-[52px] rounded-full transition-colors duration-micro ease-standard ${checked ? 'bg-primary' : 'bg-line-control'}`}>
          <span
            className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-card transition-transform duration-enter ease-spring ${checked ? 'translate-x-5' : ''}`}
          >
            {checked && <Check size={14} weight="bold" aria-hidden="true" className="animate-pop text-primary" />}
          </span>
        </span>
      </button>
    </div>
  )
}

/** Akordeon: tombol dengan aria-expanded; isi membuka lewat .collapse-grid. */
export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="tap flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-page"
      >
        <span className="min-w-0 flex-1 font-semibold leading-6">{title}</span>
        <CaretRight size={18} weight="bold" aria-hidden="true" className={`shrink-0 text-ink-secondary transition-transform duration-enter ease-enter ${open ? 'rotate-90' : ''}`} />
      </button>
      <div id={id} className="collapse-grid" data-open={open || undefined} aria-hidden={!open}>
        <div>
          <div className="px-4 pb-4 text-body text-ink-secondary">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** Muncul saat elemen masuk viewport (sekali). */
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setShown(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${className}`} data-shown={shown || undefined} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** Angka yang menghitung naik saat terlihat; nilai akhir langsung tampil bila reduced motion. */
export function CountUp({ value, format = (n: number) => n.toLocaleString('id-ID'), duration = 900 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(() => (reduceMotion() ? value : 0))
  useEffect(() => {
    if (reduceMotion()) return setN(value)
    const el = ref.current
    let raf = 0
    const run = () => {
      const t0 = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    if (!el || !('IntersectionObserver' in window)) {
      run()
      return () => cancelAnimationFrame(raf)
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect()
        run()
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])
  // Pembaca layar membaca nilai akhir, bukan angka yang sedang berjalan.
  return (
    <span ref={ref} className="tabular">
      <span aria-hidden="true">{format(n)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}

/** Lingkaran centang yang "tergambar" untuk layar sukses. */
export function SuccessMark({ size = 72 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="relative inline-flex animate-pop items-center justify-center rounded-full bg-primary-container" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} className="animate-draw" />
      </svg>
    </span>
  )
}

/** Banner saat perangkat offline; data terakhir tetap ditampilkan, aksi baru perlu koneksi. */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [back, setBack] = useState(false)
  useEffect(() => {
    let t = 0
    const on = () => (setOnline(true), setBack(true), (t = window.setTimeout(() => setBack(false), 2500)))
    const off = () => (setOnline(false), setBack(false))
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => (window.removeEventListener('online', on), window.removeEventListener('offline', off), window.clearTimeout(t))
  }, [])
  if (online && !back) return null
  return createPortal(
    <div role="status" className={`fixed inset-x-0 top-0 z-[70] flex animate-rise-in justify-center px-4 pt-[calc(8px+env(safe-area-inset-top,0px))]`}>
      <p className={`flex max-w-[448px] items-center gap-2 rounded-full px-4 py-2 text-[0.875rem] font-semibold shadow-overlay ${online ? 'bg-primary text-white' : 'bg-ink text-white'}`}>
        {online ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : <WarningCircle size={18} weight="fill" aria-hidden="true" />}
        {online ? 'Kembali online' : 'Offline. Perubahan disimpan di perangkat ini.'}
      </p>
    </div>,
    document.body,
  )
}
