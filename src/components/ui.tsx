import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CaretRight,
  CheckCircle,
  Clock,
  Info,
  Package,
  Prohibit,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react'

/* ---------- Tombol ---------- */

type BtnVariant = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger'

const btnBase =
  'tap inline-flex min-h-[52px] items-center justify-center gap-2 rounded-control px-4 py-2 text-center text-[1rem] font-semibold leading-6 disabled:cursor-not-allowed'
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-pressed active:bg-primary-pressed disabled:bg-disabled-bg disabled:text-disabled-fg',
  secondary: 'border border-line-control bg-surface text-ink hover:bg-page active:bg-primary-container disabled:text-disabled-fg',
  tonal: 'bg-primary-container text-primary hover:bg-[#DCEFDF] active:bg-[#D0E9D4]',
  ghost: 'text-primary hover:bg-primary-container',
  danger: 'border border-danger bg-surface text-danger hover:bg-danger-container',
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
      {icon && !loading && <span aria-hidden="true">{icon}</span>}
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

export function AppBar({ title, actions, back = true }: { title: string; actions?: ReactNode; back?: boolean | string }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-1 border-b border-line bg-surface px-1">
      {back && (
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink hover:bg-page"
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
      )}
      <h1 className={`min-w-0 flex-1 py-3 text-[1.125rem] font-semibold leading-[1.625rem] ${back ? '' : 'pl-3'}`}>{title}</h1>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
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
  neutral: 'bg-[#EEF1EF] text-ink-secondary',
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
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 rounded-control border border-line bg-[#EEF1EF] p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`tap flex min-h-11 min-w-[6rem] flex-auto flex-wrap items-center justify-center gap-1.5 rounded-[10px] px-1.5 text-[0.875rem] font-semibold leading-5 ${
              active ? 'bg-primary text-white shadow-card' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <span>{o.label}</span>
            {o.count !== undefined && (
              <span className={`min-w-5 rounded-full px-1.5 text-[0.75rem] leading-5 ${active ? 'bg-white text-primary' : 'bg-surface text-ink-secondary'}`}>
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
      {selected && <CheckCircle size={16} weight="fill" aria-hidden="true" />}
      {children}
    </button>
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
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-fade-in bg-[rgba(18,33,43,0.40)]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full max-w-app animate-sheet-in flex-col rounded-t-sheet bg-surface shadow-overlay focus:outline-none"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <h2 className="flex-1 text-card-title">{title}</h2>
          <IconButton label="Tutup" onClick={onClose}>
            <X size={22} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-line px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3">{footer}</div>}
      </div>
    </div>
  )
}

/** Area CTA bawah yang menempel (detail/formulir; bottom tab disembunyikan). */
export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-app -translate-x-1/2 border-t border-line bg-surface px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 shadow-nav">
      {children}
    </div>
  )
}

export function DemoNote({ children = 'Data demo' }: { children?: ReactNode }) {
  return <p className="py-6 text-center text-caption text-ink-secondary">{children} · Lestari Pangan v0.1</p>
}
