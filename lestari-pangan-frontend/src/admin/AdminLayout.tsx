import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ChartLineUp,
  ClockCounterClockwise,
  FileText,
  Gift,
  Handshake,
  Lifebuoy,
  List,
  Megaphone,
  Medal,
  Notebook,
  Package,
  SealCheck,
  SignOut,
  SquaresFour,
  Truck,
  Wallet,
  Warning,
  X,
} from '@phosphor-icons/react'
import { IconButton, OfflineBanner, Toaster, useScrolled } from '../components/ui'
import { asset } from '../lib/format'
import { useAdmin } from './store'
import { signOut } from '../services/auth'

type Item = { to: string; label: string; icon: typeof SquaresFour; badge?: number; end?: boolean }

function useNav(): { title: string; items: Item[] }[] {
  const { data } = useAdmin()
  const { contents, deliveries, issues, orgs } = data
  const count = <T extends { id: string; status: string }>(list: T[], re: RegExp) => list.filter((x) => re.test(x.status)).length
  return [
    {
      title: 'Operasi',
      items: [
        { to: '/admin', label: 'Dashboard', icon: SquaresFour, end: true },
        { to: '/admin/pengguna', label: 'Pengguna dan verifikasi', icon: SealCheck, badge: count(orgs, /Menunggu/) },
        { to: '/admin/penyaluran', label: 'Penawaran dan penyaluran', icon: Handshake },
        { to: '/admin/kendala', label: 'Antrean kendala', icon: Warning, badge: count(issues, /Menunggu/) },
        { to: '/admin/pengiriman', label: 'Pengiriman', icon: Truck, badge: count(deliveries, /Menunggu kurir/) },
        { to: '/admin/tiket', label: 'Tiket bantuan', icon: Lifebuoy, badge: data.tickets.filter((t) => t.status !== 'Selesai').length },
      ],
    },
    {
      title: 'Program dan konten',
      items: [
        { to: '/admin/konten', label: 'Konten edukasi', icon: Notebook, badge: count(contents, /Menunggu review/) },
        { to: '/admin/challenge', label: 'Eco Challenge', icon: Medal },
        { to: '/admin/reward', label: 'Reward dan klaim', icon: Gift },
        { to: '/admin/apresiasi', label: 'Materi apresiasi', icon: FileText },
        { to: '/admin/promosi', label: 'Promosi', icon: Megaphone },
      ],
    },
    {
      title: 'Dana dan audit',
      items: [
        { to: '/admin/dana', label: 'Dana dan transaksi', icon: Wallet },
        { to: '/admin/program', label: 'Program dan sponsor', icon: Package },
        { to: '/admin/laporan', label: 'Laporan terbuka', icon: ChartLineUp },
        { to: '/admin/audit', label: 'Riwayat perubahan', icon: ClockCounterClockwise },
      ],
    },
  ]
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={asset('img/logo-mark.png')} alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className="text-[1.0625rem] font-bold text-primary-pressed">Lestari Pangan</p>
        <p className="text-caption text-ink-secondary">Konsol operasi admin</p>
      </div>
    </div>
  )
}

/** Navigasi samping; indikator aktif bergeser antar-item (bukan berpindah instan). */
function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const groups = useNav()
  const { pathname } = useLocation()
  const { dispatch, state } = useAdmin()
  const navigate = useNavigate()
  const scopeLabel = { ops: 'Admin operasional', keuangan: 'Admin keuangan', konten: 'Admin konten', semua: 'Admin (semua lingkup)' }[state.staff?.scope ?? ''] ?? 'Staf'
  const wrap = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ y: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>('a[aria-current="page"]')
    setPill(el ? { y: el.offsetTop, h: el.offsetHeight } : null)
  }, [pathname])
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-4">
        <Brand />
      </div>
      <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto px-3 py-4">
        <div ref={wrap} className="relative flex flex-col gap-5">
          {pill && (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 rounded-control bg-primary-container transition-[transform,height] duration-enter ease-enter"
              style={{ transform: `translateY(${pill.y}px)`, height: pill.h }}
            />
          )}
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1.5 text-caption font-semibold uppercase tracking-wide text-ink-secondary">{g.title}</p>
              <ul className="flex flex-col gap-0.5">
                {g.items.map(({ to, label, icon: Icon, badge, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `tap relative flex min-h-11 items-center gap-3 rounded-control px-3 text-[0.9375rem] ${isActive ? 'font-semibold text-primary-pressed' : 'text-ink hover:bg-page'}`
                      }
                    >
                      <Icon size={20} aria-hidden="true" className="shrink-0" />
                      <span className="min-w-0 flex-1">{label}</span>
                      {!!badge && (
                        <span className="rounded-full bg-accent-soft px-2 text-[0.75rem] font-bold leading-5 text-accent-ink">
                          {badge}
                          <span className="sr-only"> perlu tindakan</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[0.8125rem] font-bold text-white">{(state.staff?.name ?? 'OP').slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[0.875rem] font-semibold">{state.staff?.name ?? 'Staf'}</p>
            <p className="text-caption text-ink-secondary">{scopeLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void signOut()
            dispatch({ type: 'signOut' })
            navigate('/admin/masuk', { replace: true })
          }}
          className="tap flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-[0.875rem] font-semibold text-danger hover:bg-danger-container"
        >
          <SignOut size={18} aria-hidden="true" /> Keluar
        </button>
      </div>
    </div>
  )
}

/** Laci navigasi untuk layar < 1024 px: masuk dari kiri, scrim memudar, Escape menutup. */
function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', onKey)
        document.body.style.overflow = ''
      }
    }
    const t = window.setTimeout(() => setMounted(false), 200)
    return () => window.clearTimeout(t)
  }, [open, onClose])
  if (!mounted) return null
  return createPortal(
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
      <div aria-hidden="true" onClick={onClose} className={`absolute inset-0 bg-[rgba(18,33,43,0.40)] ${open ? 'animate-fade-in' : 'animate-fade-out'}`} />
      <div role="dialog" aria-modal="true" aria-label="Menu admin" className={`absolute inset-y-0 left-0 w-[min(320px,86vw)] bg-surface shadow-overlay ${open ? 'animate-drawer-in' : 'animate-drawer-out'}`}>
        <div className="absolute right-2 top-3 z-10">
          <IconButton label="Tutup menu" onClick={onClose}>
            <X size={22} aria-hidden="true" />
          </IconButton>
        </div>
        <SideNav onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  )
}

export function AdminLayout() {
  const { state } = useAdmin()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const scrolled = useScrolled()
  const first = useRef(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (first.current) {
      first.current = false
      return
    }
    // Pembaca layar diarahkan ke judul halaman baru.
    const h1 = document.querySelector<HTMLElement>('main h1')
    if (h1) {
      h1.tabIndex = -1
      h1.focus({ preventScroll: true })
    }
  }, [pathname])
  if (!state.signedIn) return <Navigate to="/admin/masuk" replace />
  return (
    <div className="min-h-screen bg-page">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:shadow-overlay">
        Lewati ke konten
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-surface lg:block">
        <SideNav />
      </aside>
      <header
        className={`sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b bg-surface/95 px-2 backdrop-blur transition-[box-shadow,border-color] duration-micro lg:hidden ${scrolled ? 'border-line shadow-card' : 'border-transparent'}`}
      >
        <IconButton label="Buka menu" onClick={() => setMenu(true)}>
          <List size={24} aria-hidden="true" />
        </IconButton>
        <Brand />
      </header>
      <Drawer open={menu} onClose={() => setMenu(false)} />
      <div className="lg:pl-72">
        <main id="admin-main" key={pathname} className="mx-auto flex max-w-[1200px] animate-rise-in flex-col gap-5 px-4 pb-16 pt-5 md:px-8 md:pt-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <OfflineBanner />
    </div>
  )
}
